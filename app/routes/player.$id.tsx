import {
  Heading,
  Stack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  ButtonGroup,
} from "@chakra-ui/react";
import { json, unstable_defineLoader as defineLoader } from "@remix-run/node";
import {
  Link,
  MetaArgs_SingleFetch,
  redirect,
  useLoaderData,
} from "@remix-run/react";

import { db } from "../db.server.js";

import { FormattedDate } from "../components/FormattedDate.js";
import { Path as PathType } from "@prisma/client";
import { PathLink } from "../components/PathLink.js";

export const loader = defineLoader(async ({ params }) => {
  const { id } = params;

  if (id && isNaN(parseInt(id))) {
    const found = await db.player.findFirst({
      where: { name: { mode: "insensitive", equals: id } },
    });

    if (found) throw redirect(`/player/${found.id}`);
    throw json({ message: "Invalid player name" }, { status: 400 });
  }

  if (!id) throw json({ message: "Invalid player ID" }, { status: 400 });

  const player = await db.player.findUnique({
    where: { id: parseInt(id) },
    include: {
      ascensions: {
        orderBy: { ascensionNumber: "asc" },
      },
    },
  });

  const paths = (await db.path.findMany({})).reduce(
    (acc, path) => ({ ...acc, [path.name]: path }),
    {} as Record<string, PathType>,
  );

  if (!player) throw json({ message: "Player not found" }, { status: 404 });

  return { player, paths };
});

export const meta = ({ data }: MetaArgs_SingleFetch<typeof loader>) => {
  return [
    { title: `Saṃsāra ♻️ - ${data?.player.name ?? "Unknown player"}` },
    { name: "description", content: "Kingdom of Loathing ascension database" },
  ];
};

export default function Player() {
  const { player, paths } = useLoaderData<typeof loader>()!;

  return (
    <Stack spacing={10}>
      <Stack spacing={4}>
        <Heading alignSelf="center">{player.name}</Heading>
        <ButtonGroup justifyContent="center">
          <Button as={Link} leftIcon={<span>←</span>} to="/">
            home
          </Button>
        </ButtonGroup>
      </Stack>
      <Table>
        <Thead>
          <Tr>
            <Th>#</Th>
            <Th>Date</Th>
            <Th>Level</Th>
            <Th>Path</Th>
            <Th>Class</Th>
            <Th>Sign</Th>
            <Th>Days / Turns</Th>
          </Tr>
        </Thead>
        <Tbody>
          {player.ascensions.map((ascension) => {
            if (ascension.abandoned)
              return (
                <Tr key={ascension.ascensionNumber}>
                  <Td>{ascension.ascensionNumber}</Td>
                  <Td>
                    <FormattedDate date={ascension.date} />
                  </Td>
                  <Td colSpan={5} fontSize="sm" color="grey">
                    Run abandoned
                  </Td>
                </Tr>
              );
            return (
              <Tr key={ascension.ascensionNumber}>
                <Td>{ascension.ascensionNumber}</Td>
                <Td>
                  <FormattedDate date={ascension.date} />
                </Td>
                <Td>{ascension.level}</Td>
                <Td>
                  <PathLink
                    lifestyle={ascension.lifestyle}
                    path={paths[ascension.pathName]}
                  />
                </Td>
                <Td>{ascension.class}</Td>
                <Td>{ascension.sign}</Td>
                <Td>
                  {ascension.days} / {ascension.turns}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Stack>
  );
}
