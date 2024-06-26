# -*- coding: utf-8 -*-
# Generated by Django 1.11.18 on 2019-01-12 17:33
from __future__ import unicode_literals

import autoslug.fields
from django.db import migrations, models

import sweettooth.extensions.models


class Migration(migrations.Migration):
    dependencies = [
        ("extensions", "0004_auto_20181216_2102"),
    ]

    operations = [
        migrations.AlterField(
            model_name="extension",
            name="icon",
            field=models.ImageField(
                blank=True,
                default="",
                upload_to=sweettooth.extensions.models.make_icon_filename,
            ),
        ),
        migrations.AlterField(
            model_name="extension",
            name="slug",
            field=autoslug.fields.AutoSlugField(editable=False, populate_from="name"),
        ),
    ]
