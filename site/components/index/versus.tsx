import {useState, useEffect} from "react";
import cn from "@edgedb-site/shared/utils/classNames";
import {Code} from "@edgedb-site/shared/components/code";
import styles from "./styles.module.scss";


const bt = '`';
const db = '${';
const de = '}';

const EdgeDB = [
  {
    title: 'EdgeQL',
    lang: 'edgeql',
    code:
`# EdgeQL is the main query language of EdgeDB.

select Movie {
  title,
  actors: {
    name
  },
  rating := math::mean(.reviews.score)
} filter .id = <uuid>$id`
  },
  {
    title: 'EdgeQL in TypeScript',
    lang: 'typescript',
    code:
`const query = e.params({id: e.uuid}, ($) =>
  e.select(e.Movie, (movie) => ({
    title: true,
    actors: {
      name: true
    },
    rating: e.math.mean(movie.reviews.score),
    filter: e.op(movie.id, '=', $.id),
  }));
);

const result = await query.run(client, {id});`
  }
];

const Others = [
  {
    title: 'SQL',
    lang: 'sql',
    code:
`SELECT
  movie.title,
  (
    SELECT avg(rating)
    FROM reviews
    WHERE movie_id = movie.id
  ) AS avg_rating,
  (SELECT
    array_agg(q.v)
    FROM
      (SELECT
        person.name AS v
      FROM
        actors
        INNER JOIN persons AS person
          ON (actors.person_id = person.id)
      WHERE
        actors.movie_id = movie.id
      ) AS q
    WHERE q.v IS NOT NULL
  ) AS actors
FROM
  movies AS movie
WHERE
  id = $1;`
  },
  {
    title: 'Drizzle',
    lang: 'typescript',
    code:
`const movieRatingQuery = db
  .select({
    id: schema.reviews.movieId,
    avgRating: avg(schema.reviews.rating).mapWith(Number),
  })
  .from(schema.reviews)
  .groupBy(schema.reviews.movieId)
  .where(eq(schema.reviews.movieId, sql.placeholder("movieId")))
  .prepare("movieRating");

const movieQuery = db.query.movies
  .findFirst({
    columns: {
      title: true
    },
    extras: {
      avg_rating: sql${bt+db}sql.placeholder("avgRating")${de+bt}.as("avg_rating"),
    },
    with: {
      actors: {
        columns: {
          name: true
        }
      }
    },
    where: eq(schema.movies.id, sql.placeholder("movieId")),
  }).prepare('movie');

const result = await db.transaction(async () => {
  const rating = await movieRatingQuery.execute({ id });
  return await movieQuery.execute({
    id,
    avgRating: rating[0].avgRating
  });
});`
  },
  {
    title: 'Prisma',
    lang: 'typescript',
    code:
`const _result = await client.$transaction([
  client.movies.findUnique({
    where: {
      id: id,
    },
    select: {
      title: true,
      actors: {
        select: {
          person: {
            select: {
              name: true
            }
          }
        }
      }
  }),
  client.reviews.aggregate({
    _avg: {
      rating: true,
    },
    where: {
      movie: {
        id: id,
      },
    },
  }),
]);

_result[0].avg_rating = _result[1]._avg.rating;
const result = _result[0];`
  },
  {
    title: 'SQLAlchemy',
    lang: 'python',
    code:
`# assuming "Movie model" is defined with this
# "expression column":
#
#   avg_rating = orm.column_property(
#       select(func.avg(Review.rating))
#          .where(Review.movie_id == id)
#          .correlate_except(Review)
#          .scalar_subquery()
#)

stmt = (
  sa.select(m.Movie)
  .options(
      orm.selectinload(m.Movie.actors_rel).joinedload(
        m.Actors.person_rel
      ),
  )
  .filter_by(id=id)
)

movie = session.scalars(stmt).first()
actors = [rel.person_rel for rel in movie.actors_rel]

result = {
  "title": m.title,
  "actors": [
    [{"name": a.name} for a in actors]
  ],
  "avg_rating": avg_rating
}
`
  }
];


interface TabsProps {
  tabs: {title: string, code: string, lang: string}[];
}

function Tabs({tabs}: TabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className={styles.tabs}>

        <div className={styles.header}>
          {tabs.map((tab, i) => (
            <button
              key={i}
              className={cn(styles.tab, {
                [styles.active]: activeTab === i,
              })}
              onClick={() => setActiveTab(i)}
            >
              {tab.title}
            </button>
          ))}
        </div>

        <div className={styles.cnt}>
          {tabs.map((tab, i) => (
            <div key={i} className={cn(styles.tab, {[styles.active]: activeTab === i})}>
              <Code
                code={tab.code}
                language={tab.lang}
                className={styles.code}
                noCopy
              />
            </div>
          ))}
        </div>
    </div>
  );
}


export default function VersusTabs() {
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    const onResize = () => {
      setCondensed(window.innerWidth <= 768);
    };

    onResize();

    window.removeEventListener('resize', onResize);
    window.addEventListener('resize', onResize, {passive: true});

    return () => {
      window.removeEventListener('resize', onResize);
    }
  }, []);

  return <div className={cn(styles.versus, {[styles.condensed]: condensed})}>
    {
      condensed
      ? <Tabs key="single" tabs={[...EdgeDB, ...Others]} />
      : <>
          <Tabs key="left" tabs={Others} />
          <Tabs key="right" tabs={EdgeDB} />
        </>
    }
  </div>
}
