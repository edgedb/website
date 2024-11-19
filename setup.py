import setuptools

setuptools.setup(
    name='edgedbsite',
    author='MagicStack Inc',
    author_email='hello@magic.io',
    setup_requires=[
        'wheel',
    ],
    install_requires=[
        'sphinx~=4.2.0',
        'python-dateutil',
        'Pygments',
        'lxml',
        'sphinxcontrib-asyncio~=0.3.0',
        'myst-parser~=0.15.1',
        'sphinx-code-tabs',
        'Pillow',
        'sphinx_code_tabs~=0.5.3',
        'sphinxcontrib-applehelp<1.0.8',
        'sphinxcontrib-devhelp<1.0.6',
        'sphinxcontrib-htmlhelp<2.0.5',
        'sphinxcontrib-serializinghtml<1.1.10',
        'sphinxcontrib-qthelp<1.0.7',
        'tiktoken',
        'numpy',
    ],
    packages=['edgedbsite'],
    provides=['edgedbsite'],
    include_package_data=True,
)
