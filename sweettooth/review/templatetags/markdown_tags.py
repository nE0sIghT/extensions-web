import markdown2
from django import template
from django.template.defaultfilters import stringfilter

register = template.Library()


@register.filter(name="markdown2")
@stringfilter
def markdown_filter(value):
    return markdown2.markdown(value, extras=["fenced-code-blocks"], safe_mode=True)
