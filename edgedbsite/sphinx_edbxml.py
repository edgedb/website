import os

from sphinx.builders import xml
from sphinx.util.inventory import InventoryFile


INVENTORY_FILENAME = 'objects.inv'


class CustomXMLBuilder(xml.XMLBuilder):
    """A version of the standard XML builder that also outputs
       the objects.inv file to enable intersphinx.
    """

    name = 'edge-xml'

    def finish(self):
        super().finish()
        InventoryFile.dump(
            os.path.join(self.outdir, INVENTORY_FILENAME), self.env, self)


def setup(app):
    app.add_builder(CustomXMLBuilder)
