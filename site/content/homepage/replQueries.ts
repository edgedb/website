export const replQueries: {query: string}[] = [
  //   {
  //     query: `select Movie {
  //   title,
  //   release_year
  // } filter .title = "Dune";`,
  //   },
  {
    query: `select Movie {
  title,
  release_year,
  actors: {
    name,
    @character_name  # link property
  }
}
filter .title = "Black Widow";`,
  },

  {
    query: `insert Movie {
  title := "Thor: Love and Thunder",
  release_year := 2022,
  actors := (
    select Person
    filter .name in {
      "Chris Hemsworth",
      "Natalie Portman",
      "Taika Waititi",
    }
  )
}`,
  },
  {
    query: `with actor_name := "Zendaya"
select Movie {
  id,
  title,
  trimmed_title := str_trim(.title),
}
filter actor_name in .actors.name`,
  },
];
