import {
  Text,
  Stack,
  Heading,
  Card,
  CardHeader,
  CardBody,
  HStack,
  Select,
  Button,
  Input,
  InputGroup,
  InputRightAddon,
} from "@chakra-ui/react";
import type { MetaFunction } from "@remix-run/node";
import { json, Link, useLoaderData, useNavigate } from "@remix-run/react";
import { FrequencyGraph } from "../components/FrequencyGraph.js";
import { Counter } from "../components/Counter.js";
import { db } from "~/db.server";
import { PopularityGraph } from "~/components/PopularityGraph";
import { PathLink } from "~/components/PathLink";
import { CoolStat } from "~/components/CoolStat";
import { FormEventHandler, useCallback } from "react";
import { formatPathName } from "~/utils.js";

export const meta: MetaFunction = () => {
  return [
    { title: "Saṃsāra ♻️" },
    { name: "description", content: "Kingdom of Loathing ascension database" },
  ];
};

export const loader = async () => {
  const totalTracked = await db.ascension.count();

  const frequency = await db.ascension.getStats();
  const popularity = await db.ascension.getPopularity();

  const [{ loopers }] = await db.$queryRaw<[{ loopers: number }]>`
    SELECT COUNT(*)::integer AS "loopers" FROM (
      SELECT
        "name"
	    FROM "Player"
	    LEFT JOIN "Ascension" ON "Player"."id" = "Ascension"."playerId"
	    WHERE
		    "Ascension"."date" >= DATE_TRUNC('day', NOW() - interval '1 week') AND
		    "Ascension"."date" < DATE_TRUNC('day', NOW())
	    GROUP BY "Player"."id"
	    HAVING COUNT("Ascension"."playerId") >= 7)
  `;

  const [{ loopersPrev }] = await db.$queryRaw<[{ loopersPrev: number }]>`
    SELECT COUNT(*)::integer AS "loopersPrev" FROM (
      SELECT
        "name"
      FROM "Player"
      LEFT JOIN "Ascension" ON "Player"."id" = "Ascension"."playerId"
      WHERE
        "Ascension"."date" >= DATE_TRUNC('day', NOW() - interval '2 week') AND
        "Ascension"."date" < DATE_TRUNC('day', NOW() - interval '1 week')
      GROUP BY "Player"."id"
      HAVING COUNT("Ascension"."playerId") >= 7)
    `;

  const loopersChange = loopers / loopersPrev - 1;

  const currentPath = (await db.path.findFirst({
    where: { start: { lt: new Date() }, end: { gte: new Date() } },
  })) ?? { name: "Standard", slug: "standard" };

  const [{ currentPathers }] = await db.$queryRaw<[{ currentPathers: number }]>`
    SELECT COUNT(*)::integer AS "currentPathers" FROM (
      SELECT
        "name"
      FROM "Player"
      LEFT JOIN "Ascension" ON "Player"."id" = "Ascension"."playerId"
      WHERE
        "Ascension"."pathName" = ${currentPath.name} AND
        "Ascension"."date" >= DATE_TRUNC('day', NOW() - interval '1 week') AND
        "Ascension"."date" < DATE_TRUNC('day', NOW())
      GROUP BY "Player"."id")
  `;

  const [{ currentPathersPrev }] = await db.$queryRaw<
    [{ currentPathersPrev: number }]
  >`
    SELECT COUNT(*)::integer AS "currentPathersPrev" FROM (
      SELECT
        "name"
      FROM "Player"
      LEFT JOIN "Ascension" ON "Player"."id" = "Ascension"."playerId"
      WHERE
        "Ascension"."pathName" = ${currentPath.name} AND
        "Ascension"."date" >= DATE_TRUNC('day', NOW() - interval '2 week') AND
        "Ascension"."date" < DATE_TRUNC('day', NOW() - interval '1 week')
      GROUP BY "Player"."id")
  `;

  const currentPathersChange = currentPathers / currentPathersPrev - 1;

  // If we could add raw SQL, `ORDER BY id = 999, id DESC, name ASC` would do this
  const paths = (
    await db.path.findMany({
      orderBy: [{ id: { nulls: "last", sort: "desc" } }, { name: "asc" }],
    })
  ).sort((a, b) => (a.id === 999 ? 1 : b.id === 999 ? -1 : 0));

  return json({
    paths,
    loopers,
    loopersChange,
    currentPath,
    currentPathers,
    currentPathersChange,
    frequency,
    totalTracked,
    popularity,
  });
};

export default function Index() {
  const {
    paths,
    loopers,
    loopersChange,
    currentPath,
    currentPathers,
    currentPathersChange,
    frequency,
    totalTracked,
    popularity,
  } = useLoaderData<typeof loader>();

  const navigate = useNavigate();

  const goToPath = useCallback<FormEventHandler<HTMLFormElement>>(
    (event) => {
      event.preventDefault();
      const slug = (
        event.currentTarget.elements.namedItem(
          "slug",
        ) as HTMLSelectElement | null
      )?.value;
      if (!slug) return;
      navigate(`/path/${slug}`);
      return;
    },
    [navigate],
  );

  const goToPlayer = useCallback<FormEventHandler<HTMLFormElement>>(
    (event) => {
      event.preventDefault();
      const player = (
        event.currentTarget.elements.namedItem(
          "player",
        ) as HTMLInputElement | null
      )?.value;
      if (!player) return;
      navigate(`/player/${player}`);
      return;
    },
    [navigate],
  );

  return (
    <Stack spacing={12} alignItems="stretch">
      <Stack spacing={8} alignItems="center">
        <Heading alignSelf="center">
          <Link to="/">Saṃsāra ♻️</Link>
        </Heading>

        <Stack direction="row" justifyContent="center" alignItems="center">
          <Text>Now tracking</Text>
          <Counter value={totalTracked} duration={1} lineHeight={25} />
          <Text>incarnations!</Text>
        </Stack>
      </Stack>
      <HStack justifyContent="space-around">
        <Card>
          <CardHeader>
            <Heading size="md">Browse by path</Heading>
          </CardHeader>
          <CardBody>
            <form onSubmit={goToPath}>
              <InputGroup>
                <Select name="slug" borderRightRadius={0}>
                  {paths.map((path) => (
                    <option key={path.name} value={path.slug}>
                      {formatPathName(path.name)}
                    </option>
                  ))}
                </Select>
                <InputRightAddon>
                  <Button type="submit">Go</Button>
                </InputRightAddon>
              </InputGroup>
            </form>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <Heading size="md">Browse by player</Heading>
          </CardHeader>
          <CardBody>
            <form onSubmit={goToPlayer}>
              <InputGroup>
                <Input
                  name="player"
                  type="text"
                  placeholder="Player name or id"
                />
                <InputRightAddon>
                  <Button type="submit">Go</Button>
                </InputRightAddon>
              </InputGroup>
            </form>
          </CardBody>
        </Card>
      </HStack>
      <Card height={400}>
        <CardHeader>
          <Heading size="md">Top 10 paths in the last week</Heading>
        </CardHeader>
        <CardBody>
          <PopularityGraph data={popularity} />
        </CardBody>
      </Card>
      <Card height={200}>
        <CardHeader>
          <Heading size="md">All time ascension frequency</Heading>
        </CardHeader>
        <CardBody>
          <FrequencyGraph data={frequency} />
        </CardBody>
      </Card>
      <HStack justifyContent="space-around">
        <CoolStat current={currentPathers} change={currentPathersChange}>
          Accounts that ascended <PathLink path={currentPath} /> this week
        </CoolStat>
        <CoolStat current={loopers} change={loopersChange}>
          Accounts that ascended every day in the last week
        </CoolStat>
      </HStack>
    </Stack>
  );
}
