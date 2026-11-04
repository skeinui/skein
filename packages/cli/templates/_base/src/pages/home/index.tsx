{{#if shell}}
{{else}}
import { Button, Card, Flex } from "@skeinui/ui";
import { useState } from "react";

export function HomePage() {
  const [count, setCount] = useState(0);
  return (
    <main className="home">
      <Card>
        <Card.Header>
          <Card.Title>{{title}}</Card.Title>
          <Card.Description>Edit src/pages/home/index.tsx and save to reload.</Card.Description>
        </Card.Header>
        <Card.Body>
          <Flex gap="sm">
            <Button color="primary" onClick={() => setCount((c) => c + 1)}>
              Count is {count}
            </Button>
            <Button variant="outline" onClick={() => setCount(0)}>
              Reset
            </Button>
          </Flex>
        </Card.Body>
      </Card>
    </main>
  );
}
{{/if}}
