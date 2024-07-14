/*
    GNOME Shell extensions repository
    Copyright (C) 2012  Jasper St. Pierre <jstpierre@mecheye.net>
    Copyright (C) 2017  Yuri Konotopov <ykonotopov@gnome.org>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
 */

define(['jquery', 'template!diff/equals_chunk_row'], function ($, rowTemplate) {
	"use strict";

	var exports = {};

	// Each table row has three columns:
	// ===================================================================
	// | Old Line Number | New Line Number | Diff |
	//
	// Each "buildChunk" function below should build full row(s).

	function buildEqualChunk(chunk, oldContents, newContents, language) {
		let $elems = [];

		for (let i in chunk.lines)
		{
			let line = chunk.lines[i];

			var $row = $(rowTemplate.render({
				oldlinenum: line.oldlinenum,
				newlinenum: line.newlinenum,
				contents: oldContents[line.oldindex]
			}));

			$row.find('.code-line').addClass(`${language}`)

			if (i == 0)
			{
				$row.addClass('equals-chunk-first-row')
			}

			if (chunk.collapsable)
			{
				if (i == 0)
				{
					$row.find('.contents').append(
						$('<a>', {'class': 'collapsable-trigger'}).text('+')
					);
				}
				else
				{
					$row.addClass('collapsable-collapsed-row').hide();
				}
			}

			$elems.push($row);
		}

		return $elems;
	}

	// This is called for changes within lines in a 'replace' chunk,
	// one half-row at a time.  'contents' here is the line's contents
	//
	// If we replace:
	//     "this is a long, long line."
	//
	// with:
	//     "this is yet another long, long line."
	//
	// then we get regions that look like:
	//     [8, 9]  ,  [8, 13]
	// Our job is to highlight the replaced regions on the respective
	// half-row.
	function buildReplaceRegions(regions, contents) {
		function span(tag, text) {
			return $('<span>', {'class': 'diff-inline'}).addClass(tag).text(text);
		}

		function unchanged(text) {
			return span('unchanged', text);
		}

		function changed(text) {
			return span('changed', text);
		}

		// If there's no region, then SequentialMatcher failed to
		// find something useful, or we're in a regular delete/inserted
		// chunk. Highlight the entire region as unchanged.
		if (!regions || regions.length === 0)
		{
			return unchanged(contents);
		}

		var regionElems = [];
		var lastEnd = 0;

		for (let region of regions)
		{
			let start = region[0], end = region[1];

			// The indexes in the 'regions' are the changed regions. We
			// can expect that the regions in between the indexes are
			// unchanged regions, so build those.

			regionElems.push(unchanged(contents.slice(lastEnd, start)));
			regionElems.push(changed(contents.slice(start, end)));

			lastEnd = end;
		}

		// We may have an unchanged region left over at the end of a row.
		if (contents.slice(lastEnd))
		{
			regionElems.push(unchanged(contents.slice(lastEnd)));
		}

		return regionElems;
	}

	function buildInsertLine(line, contents, language) {
		return $('<tr>', {'class': 'diff-line inserted'})
			.append($('<td>', {'class': 'linum'}))
			.append($('<td>', {'class': 'new linum'}).text(line.newlinenum))
			.append($('<td>', {'class': 'new contents'})
				.append(
        			$('<span>', {'class': `code-line ${language}`})
				    	.append(buildReplaceRegions(line.newregion, contents[line.newindex]))
        		)
    	);
	}

	function buildInsertChunk(chunk, oldContents, newContents, language) {
		return $.map(chunk.lines, function (line) {
			return buildInsertLine(line, newContents, language);
		});
	}

	function buildDeleteLine(line, contents, language) {
		return $('<tr>', {'class': 'diff-line deleted'})
			.append($('<td>', {'class': 'old linum'}).text(line.oldlinenum))
			.append($('<td>', {'class': 'linum'}))
			.append($('<td>', {'class': 'old contents'})
				.append(
					$('<span>', {'class': `code-line ${language}`})
						.append(buildReplaceRegions(line.oldregion, contents[line.oldindex]))
				)
    	);
	}

	function buildDeleteChunk(chunk, oldContents, newContents, language) {
		return $.map(chunk.lines, function (line) {
			return buildDeleteLine(line, oldContents, language);
		});
	}

	function buildReplaceChunk(chunk, oldContents, newContents, language) {
		// Replace chunks are built up of a delete chunk and
		// an insert chunk, with special inline replace regions
		// for the inline modifications.

		var deleteChunk = [], insertChunk = [];

		for (let line of chunk.lines)
		{
			deleteChunk.push(buildDeleteLine(line, oldContents, language));
			insertChunk.push(buildInsertLine(line, newContents, language));
		}

		return deleteChunk.concat(insertChunk);
	}

	var operations = {
		'equal': buildEqualChunk,
		'insert': buildInsertChunk,
		'delete': buildDeleteChunk,
		'replace': buildReplaceChunk
	};

	exports.buildDiffTable = function (filename, chunks, oldContents, newContents) {
		var $table = $('<table>', {'class': 'code'});

    	var language = !filename.includes('.') ? 'undefined' : filename.split('.').pop();

		for (let chunk of chunks)
		{
			$table.append(operations[chunk.change](chunk, oldContents, newContents, language));
		}

		$table.on('click', 'a.collapsable-trigger', function (event) {
			let triggerRow = $(this).closest('tr.equals-chunk-first-row');
			triggerRow.toggleClass('collapsed');
			triggerRow.nextUntil('tr.equals-chunk-first-row').toggle();
			if ($(this).text() == '-')
			{
				$(this).text('+');
			}
			else
			{
				$(this).text('-');
			}
		});

		return $table;
	};

	return exports;
});
