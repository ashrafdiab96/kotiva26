"""Shared Blade -> Twig substitutions for the KOTIVA port (used once per page; kept for audit).

Only URL/asset expressions and comment syntax change. Markup, copy, inline styles and
scripts are carried over byte-for-byte."""
import re

LISTING = {'face': 'cleanser', 'treatments': 'treatment', 'sunscreen': 'spf'}

def route_url(name):
    key = {'home': 'home', 'science': 'science', 'about': 'about', 'journal': 'journal', 'contact': 'contact',
           'ingredients': 'ingredients', 'routine-finder': 'routine_finder', 'privacy-policy': 'privacy_policy',
           'terms': 'terms', 'shop.index': 'shop'}[name]
    return "{{ theme.settings.get('kotiva_url_%s') }}" % key

def convert(src):
    s = src
    s = re.sub(r"\{\{--(.*?)--\}\}", lambda m: '{#' + m.group(1) + '#}', s, flags=re.S)
    s = re.sub(r"\{\{\s*asset\('([^']+)'\)\s*\}\}(\?v=\{\{[^}]*\}\})?", lambda m: "{{ 'kotiva/%s'|asset }}" % m.group(1), s)
    s = s.replace("{{ Salla::storeUrl() }}", "{{ theme.settings.get('kotiva_url_shop') }}")
    s = re.sub(r"\{\{\s*Salla::listingUrl\('([\w-]+)'\)\s*\}\}",
               lambda m: "{{ theme.settings.get('kotiva_url_shop') }}?filter=%s" % LISTING.get(m.group(1), m.group(1)), s)
    s = re.sub(r"\{\{\s*route\('([\w.-]+)'\)\s*\}\}", lambda m: route_url(m.group(1)), s)
    s = s.replace("@verbatim\n", "").replace("@endverbatim\n", "")
    return s

def leftovers(s):
    """Blade constructs that still need a hand port."""
    return sorted(set(re.findall(r"@(?:if|foreach|for|php|json|csrf|push|endpush|section|endsection|stack|yield)\b|\{\{\s*\$[\w>-]+|\{!!|Salla::|route\(|config\(", s)))
