import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Heading,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useMemo } from "react";
import { AscensionsGraph } from "~/components/AscensionsGraph";
import { Leaderboard } from "~/components/Leaderboard";
import { FormattedDate } from "~/components/FormattedDate";
import { db } from "~/db.server";
import { derivePathInfo, getLeaderboard } from "~/utils";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { slug } = params;
  const path = await db.path.findFirst({ where: { slug } });

  if (!path) throw json({ message: "Invalid path name" }, { status: 400 });

  const first = await db.ascension.findFirst({
    where: { pathName: path.name },
    orderBy: { date: "asc" },
  });

  if (!first) throw json({ message: "No ascensions found" }, { status: 404 });

  const pathExtra = derivePathInfo(first);

  const isCurrent = !!pathExtra.end && new Date() < pathExtra.end;

  const bestHCEver = await getLeaderboard(path.name, "HARDCORE");
  const bestSCEver = await getLeaderboard(path.name, "SOFTCORE");
  const bestHCInSeason = pathExtra.end
    ? await getLeaderboard(path.name, "HARDCORE", undefined, pathExtra.end)
    : null;
  const bestSCInSeason = pathExtra.end
    ? await getLeaderboard(path.name, "SOFTCORE", undefined, pathExtra.end)
    : null;

  const stats = await db.ascension.getStats(undefined, pathExtra.name);

  return json({
    path: { ...path, ...pathExtra },
    stats,
    isCurrent,
    bestHCEver,
    bestSCEver,
    bestHCInSeason,
    bestSCInSeason,
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `Saṃsāra ♻️ - ${data?.path}` },
    {
      name: "description",
      content: `Ascension stats for the ${data?.path} path`,
    },
  ];
};

export default function Path() {
  const {
    path,
    isCurrent,
    stats,
    bestHCInSeason,
    bestHCEver,
    bestSCEver,
    bestSCInSeason,
  } = useLoaderData<typeof loader>();

  const scLeaderboard = useMemo(
    () => bestSCInSeason?.map((a) => ({ ...a, date: new Date(a.date) })),
    [bestSCInSeason],
  );
  const hcLeaderboard = useMemo(
    () => bestHCInSeason?.map((a) => ({ ...a, date: new Date(a.date) })),
    [bestHCInSeason],
  );
  const scPyrites = useMemo(
    () => bestSCEver.map((a) => ({ ...a, date: new Date(a.date) })),
    [bestSCEver],
  );
  const hcPyrites = useMemo(
    () => bestHCEver.map((a) => ({ ...a, date: new Date(a.date) })),
    [bestHCEver],
  );

  return (
    <Stack spacing={10}>
      <Stack alignItems="center">
        <Heading>{path.name}</Heading>
        {path.start && path.end && (
          <Text size="md">
            <FormattedDate date={path.start} /> -{" "}
            <FormattedDate date={path.end} />
          </Text>
        )}
      </Stack>
      <Box height={150} width="50%" alignSelf="center">
        <AscensionsGraph data={stats} inSeasonTo={path.end} />
      </Box>
      <Accordion allowToggle>
        {scLeaderboard && hcLeaderboard && (
          <AccordionItem>
            <AccordionButton>
              <HStack flex={1}>
                <Heading size="md">Leaderboards</Heading>{" "}
                <Text>
                  {isCurrent
                    ? "The official leaderboards as they currently stand"
                    : "The official leaderboards frozen once the path went out-of-season"}
                </Text>
              </HStack>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <HStack alignItems="start">
                <Leaderboard
                  title="Softcore Leaderboard"
                  ascensions={scLeaderboard}
                />
                <Leaderboard
                  title="Hardcore Leaderboard"
                  ascensions={hcLeaderboard}
                />
              </HStack>
            </AccordionPanel>
          </AccordionItem>
        )}
        {!isCurrent && (
          <AccordionItem>
            <AccordionButton>
              <HStack flex={1}>
                <Heading size="md">Pyrites</Heading>{" "}
                <Text>
                  A hypothetical leaderboard for all-time; invented, respected,
                  and dominated by fools
                </Text>
              </HStack>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <HStack alignItems="start">
                <Leaderboard title="Softcore Pyrites" ascensions={scPyrites} />
                <Leaderboard title="Hardcore Pyrites" ascensions={hcPyrites} />
              </HStack>
            </AccordionPanel>
          </AccordionItem>
        )}
      </Accordion>
    </Stack>
  );
}