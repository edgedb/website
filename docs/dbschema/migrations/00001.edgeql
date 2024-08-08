CREATE MIGRATION m1rhb7lmbuk543k6p57jmch4fumz4odynxwzz5k6k7cdgietxavyqq
ONTO initial
{
CREATE EXTENSION pgvector VERSION '0.4';
CREATE FUTURE nonrecursive_access_policies;
CREATE SCALAR TYPE default::OpenAIEmbedding EXTENDING ext::pgvector::vector<1536>;
CREATE TYPE default::Section {
CREATE REQUIRED PROPERTY embedding: default::OpenAIEmbedding;
CREATE INDEX ext::pgvector::ivfflat_cosine(lists := 3) ON (.embedding);
CREATE REQUIRED PROPERTY checksum: std::str;
CREATE REQUIRED PROPERTY content: std::str;
CREATE REQUIRED PROPERTY path: std::str {
CREATE CONSTRAINT std::exclusive;
};
CREATE REQUIRED PROPERTY tokens: std::int16;
};
};
