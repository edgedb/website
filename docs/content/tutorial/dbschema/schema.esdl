using extension notebook;

module default {
  type Account {
    required username: str {
      constraint exclusive;
    };
    multi watchlist: Content;
  }

  type Person {
    required name: str;
    link filmography := .<actors[is Content];
  }

  abstract type Content {
    required title: str;
    multi actors: Person {
      character_name: str;
    };
  }

  type Movie extending Content {
    release_year: int32;
  }

  type Show extending Content {
    property num_seasons := count(.<show[is Season]);
  }

  type Season {
    required number: int32;
    required show: Show;
  }
};
