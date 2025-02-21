CREATE MIGRATION m1wgnkczjy43ojf5knoqmxvcml7v7ipoo3dhre6yoj5u4xic4c6k4a
    ONTO initial
{
  CREATE EXTENSION notebook VERSION '1.0';
  CREATE TYPE default::Account {
      CREATE REQUIRED PROPERTY username -> std::str {
          CREATE CONSTRAINT std::exclusive;
      };
  };
  CREATE ABSTRACT TYPE default::Content {
      CREATE REQUIRED PROPERTY title -> std::str;
  };
  ALTER TYPE default::Account {
      CREATE MULTI LINK watchlist -> default::Content;
  };
  CREATE TYPE default::Movie EXTENDING default::Content {
      CREATE PROPERTY release_year -> std::int32;
  };
  CREATE TYPE default::Show EXTENDING default::Content;
  CREATE TYPE default::Person {
      CREATE REQUIRED PROPERTY name -> std::str;
  };
  ALTER TYPE default::Content {
      CREATE MULTI LINK actors -> default::Person {
          CREATE PROPERTY character_name -> std::str;
      };
  };
  ALTER TYPE default::Person {
      CREATE LINK filmography := (.<actors[IS default::Content]);
  };
  CREATE TYPE default::Season {
      CREATE REQUIRED LINK show -> default::Show;
      CREATE REQUIRED PROPERTY number -> std::int32;
  };
  ALTER TYPE default::Show {
      CREATE PROPERTY num_seasons := (std::count(.<show[IS default::Season]));
  };
};
