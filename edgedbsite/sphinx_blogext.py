import json

import dateutil.parser  # type: ignore

from sphinx import domains
from sphinx.util.nodes import split_explicit_title

from docutils import nodes
from docutils.parsers.rst import Directive, directives


class AuthorProfileNode(nodes.Element):
    tagname = 'blog-author-profile'


class AuthorNode(nodes.TextElement):
    tagname = 'blog-author'


class DescriptionNode(nodes.TextElement):
    tagname = 'blog-description'


class PublishedOnNode(nodes.TextElement):
    tagname = 'blog-published-on'


class DraftNode(nodes.TextElement):
    tagname = 'blog-draft'


class GuidNode(nodes.TextElement):
    tagname = 'blog-guid'


class LeadImageNode(nodes.image):
    tagname = 'blog-lead-image'


class LeadYouTubeNode(nodes.Element):
    tagname = 'blog-lead-youtube'


class LeadImageAltNode(nodes.TextElement):
    tagname = 'blog-lead-image-alt'


class AsideNode(nodes.Element):
    tagname = 'aside'


class LocalLinkNode(nodes.Element):
    tagname = 'blog-local-link'


class GitHubButtonNode(nodes.Element):
    tagname = 'github-button'


class StrikeNode(nodes.Element):
    tagname = 'strike'


class ChartNode(nodes.Element):
    tagname = 'blog-chart'

class RecommendationNode(nodes.TextElement):
    tagname = 'blog-recommendation'


class AuthorProfile(Directive):
    has_content = False
    required_arguments = 0
    optional_arguments = 0
    option_spec = dict(
        key=directives.unchanged_required,
        name=directives.unchanged_required,
        email=directives.unchanged_required,
        twitter=str,
        github=str,
    )

    def run(self):
        node = AuthorProfileNode()
        node['profile'] = 'true'
        node['key'] = self.options['key']
        node['email'] = self.options['email']
        node['name'] = self.options['name']
        if 'twitter' in self.options:
            node['twitter'] = self.options.get('twitter')
        if 'github' in self.options:
            node['github'] = self.options.get('github')
        return [node]


class Authors(Directive):
    required_arguments = 1
    optional_arguments = 100

    def run(self):
        return [AuthorNode(text=arg) for arg in self.arguments]


class Draft(Directive):
    required_arguments = 0
    optional_arguments = 0

    def run(self):
        return [DraftNode(text='yes')]


class PublishedOn(Directive):
    required_arguments = 1
    optional_arguments = 0
    final_argument_whitespace = True

    def run(self):
        date = dateutil.parser.parse(self.arguments[0]).isoformat()
        return [PublishedOnNode(text=date)]


class Guid(Directive):
    required_arguments = 1
    optional_arguments = 0
    final_argument_whitespace = True

    def run(self):
        return [GuidNode(text=self.arguments[0])]

class Recommendations(Directive):
    required_arguments = 1
    final_argument_whitespace = True

    def run(self):
        values = [value.strip() for value in self.arguments[0].split(',')]
        return [RecommendationNode(text=arg) for arg in values]

class LeadImage(Directive):
    required_arguments = 1
    optional_arguments = 0

    def run(self):
        node = LeadImageNode()
        node['uri'] = directives.uri(self.arguments[0])
        self.add_name(node)
        return [node]


class LeadYouTube(Directive):
    required_arguments = 1
    optional_arguments = 0

    def run(self):
        node = LeadYouTubeNode()
        node['ytid'] = directives.uri(self.arguments[0])
        self.add_name(node)
        return [node]


class Description(Directive):
    has_content = True
    required_arguments = 0
    optional_arguments = 0

    def run(self):
        return [DescriptionNode(text='\n'.join(self.content))]


class LeadImageAlt(Directive):
    has_content = True
    required_arguments = 0
    optional_arguments = 0

    def run(self):
        return [LeadImageAltNode(text='\n'.join(self.content))]


class Aside(Directive):
    has_content = True
    required_arguments = 0
    optional_arguments = 0

    def run(self):
        node = AsideNode()
        self.state.nested_parse(self.content, self.content_offset, node)
        return [node]


class Quote(Directive):

    has_content = True
    required_arguments = 1
    optional_arguments = 100

    def run(self):
        blockquote = nodes.block_quote()
        self.state.nested_parse(
            self.content, self.content_offset, blockquote)
        blockquote['attribution'] = ' '.join(self.arguments)
        blockquote['classes'] = ['pull-quote']
        return [blockquote]


class Chart(Directive):
    has_content = True
    required_arguments = 1
    optional_arguments = 0

    def run(self):
        data = '\n'.join(self.content)
        data = json.dumps(json.loads(data), separators=(',', ':'))
        node = ChartNode()
        node['cmp'] = self.arguments[0]
        node['data'] = data
        return [node]

class Gallery(Directive):
    has_content = True
    required_arguments = 0
    optional_arguments = 0

    def run(self):
        node = nodes.container()
        node['image-gallery'] = True
        self.state.nested_parse(self.content, self.content_offset, node)
        return [node]


def local_file_role(typ, rawtext, text, lineno, inliner,
                    options={}, content=[]):

    env = inliner.document.settings.env

    _, title, file = split_explicit_title(text)

    rel_path, full_path = env.relfn2path(file, env.docname)

    node = LocalLinkNode()
    node['file'] = file
    node['title'] = title
    node['rel_path'] = rel_path
    return [node], []


def github_button_role(typ, rawtext, text, lineno, inliner,
                       options={}, content=[]):

    node = GitHubButtonNode()

    items = text.split('|')
    for item in items:
        key, value = item.split(':', 1)
        node[key.strip()] = value.strip()

    return [node], []


def strike_role(typ, rawtext, text, lineno, inliner,
                options={}, content=[]):

    node = StrikeNode()
    node['text'] = text
    return [node], []


class BlogDomain(domains.Domain):

    name = 'blog'
    label = 'Blog'

    roles = {
        'local-file': local_file_role,
        'github-button': github_button_role,
        'strike': strike_role,
    }

    directives = {
        'author-profile': AuthorProfile,
        'authors': Authors,
        'draft': Draft,
        'published-on': PublishedOn,
        'lead-image': LeadImage,
        'lead-image-alt': LeadImageAlt,
        'lead-youtube': LeadYouTube,
        'description': Description,
        'chart': Chart,
        'guid': Guid,
        'quote': Quote,
        'gallery': Gallery,
        "recommendations": Recommendations
    }


def setup(app):
    app.add_node(AuthorProfileNode)
    app.add_node(AuthorNode)
    app.add_node(DescriptionNode)
    app.add_node(DraftNode)
    app.add_node(PublishedOnNode)
    app.add_node(LeadImageNode)
    app.add_node(LeadImageAltNode)
    app.add_node(LeadYouTubeNode)
    app.add_node(AsideNode)
    app.add_node(LocalLinkNode)
    app.add_node(GitHubButtonNode)
    app.add_node(StrikeNode)
    app.add_node(ChartNode)
    app.add_node(GuidNode)
    app.add_node(RecommendationNode)

    app.add_domain(BlogDomain)
