import {
  HStack,
  Stack,
  Heading,
  Image,
  Text,
  Box,
  ButtonGroup,
  Button,
} from "@chakra-ui/react";

import { FrequencyGraph } from "./FrequencyGraph";
import { FormattedDate } from "./FormattedDate";
import { formatPathName, PostgresInterval } from "../utils";
import { Link } from "@remix-run/react";

type Datum = { date: Date; count: number };
type Props = {
  path: {
    name: string;
    seasonal: boolean;
    start: Date | null;
    end: Date | null;
    image: string | null;
  };
  stats: [data: Datum[], cadence: PostgresInterval];
};

function formatImage(image: string | null) {
  if (image === "oxy") return "smalloxy";
  return image;
}

export function PathHeader({ path, stats }: Props) {
  const image = formatImage(path.image);

  return (
    <Stack alignItems="center">
      <HStack>
        <Heading>{formatPathName(path.name)}</Heading>
        {image && (
          <Image
            src={`https://s3.amazonaws.com/images.kingdomofloathing.com/itemimages/${image}.gif`}
          />
        )}
      </HStack>
      {path.start && path.end && (
        <Text size="md">
          <FormattedDate date={path.start} /> -{" "}
          <FormattedDate date={path.end} />
        </Text>
      )}
      <ButtonGroup justifyContent="center">
        <Button as={Link} leftIcon={<span>←</span>} to="/">
          home
        </Button>
      </ButtonGroup>
      <Box mt={8} height={150} width={["100%", null, "60%"]} alignSelf="center">
        <FrequencyGraph
          data={stats}
          inSeasonTo={path.seasonal ? path.end : null}
        />
      </Box>
    </Stack>
  );
}
