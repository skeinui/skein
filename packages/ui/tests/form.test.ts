import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";
import {
  Checkbox,
  CheckboxGroup,
  Field,
  Input,
  InputGroup,
  Radio,
  RadioGroup,
  Switch,
  Textarea,
} from "../src/index.ts";

const html = (node: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(node);
/** Base UI writes inline styles (visually hidden) on its hidden native input; that is behavior, not our appearance, so strip it before checking. */
const noStyle = (out: string) => {
  const own = out.replace(/<input[^>]*>/g, "");
  expect(own).not.toContain("class=");
  expect(own).not.toContain("style=");
};

describe("Input / Textarea / InputGroup", () => {
  test("Input has only hooks, outline + md by default", () => {
    const out = html(h(Input, { placeholder: "x" }));
    expect(out).toContain("<input");
    expect(out).toContain('data-slot="input"');
    expect(out).toContain('data-variant="outline"');
    expect(out).toContain('data-size="md"');
    noStyle(out);
  });

  test("size is a visual step, not the native size attribute", () => {
    const out = html(h(Input, { size: "lg" }));
    expect(out).toContain('data-size="lg"');
    expect(out).not.toMatch(/\ssize="/);
  });

  test("invalid written as data-invalid + aria-invalid", () => {
    const out = html(h(Input, { invalid: true }));
    expect(out).toContain("data-invalid");
    expect(out).toContain('aria-invalid="true"');
    expect(html(h(Input, null))).not.toContain("data-invalid");
  });

  test("fullWidth / variant written as hooks", () => {
    const out = html(h(Input, { fullWidth: true, variant: "filled" }));
    expect(out).toContain("data-full-width");
    expect(out).toContain('data-variant="filled"');
  });

  test("Textarea renders a <textarea>", () => {
    const out = html(h(Textarea, { defaultValue: "hi" }));
    expect(out).toContain("<textarea");
    expect(out).toContain('data-slot="textarea"');
    noStyle(out);
  });

  test("InputGroup's prefix and suffix each have a slot", () => {
    const out = html(
      h(
        InputGroup,
        null,
        h(InputGroup.Prefix, null, "https://"),
        h(InputGroup.Input, { placeholder: "x" }),
        h(InputGroup.Suffix, null, ".com"),
      ),
    );
    for (const slot of [
      "input-group",
      "input-group-prefix",
      "input-group-input",
      "input-group-suffix",
    ]) {
      expect(out).toContain(`data-slot="${slot}"`);
    }
    noStyle(out);
  });
});

describe("Field", () => {
  test("variant / size become the defaults of nested controls through context", () => {
    const out = html(
      h(Field, { variant: "filled", size: "sm" }, h(Field.Label, null, "Name"), h(Input, null)),
    );
    expect(out).toContain('data-slot="field"');
    expect(out).toContain('data-slot="field-label"');
    const input = out.slice(out.indexOf("<input"));
    expect(input).toContain('data-variant="filled"');
    expect(input).toContain('data-size="sm"');
  });

  test("a control's own values win over Field", () => {
    const out = html(h(Field, { variant: "filled" }, h(Input, { variant: "outline" })));
    expect(out.slice(out.indexOf("<input"))).toContain('data-variant="outline"');
  });

  test("required is only a data-required hook, for theme styles to draw the asterisk", () => {
    expect(html(h(Field, { required: true }, h(Input, null)))).toContain("data-required");
    expect(html(h(Field, null, h(Input, null)))).not.toContain("data-required");
  });

  test("an invalid Field gives its controls data-invalid and can show the error", () => {
    const out = html(
      h(
        Field,
        { invalid: true },
        h(Input, null),
        h(Field.Error, { match: true }, "Something went wrong"),
      ),
    );
    expect(out.slice(out.indexOf("<input"))).toContain("data-invalid");
    expect(out).toContain('data-slot="field-error"');
    expect(out).toContain("Something went wrong");
    noStyle(out);
  });

  test("description has a slot", () => {
    expect(html(h(Field, null, h(Field.Description, null, "hint")))).toContain(
      'data-slot="field-description"',
    );
  });
});

describe("Checkbox", () => {
  test("the label wraps the control and text, every part has a slot, both svgs are there", () => {
    const out = html(h(Checkbox, { description: "Details" }, "I agree"));
    expect(out.startsWith("<label")).toBe(true);
    for (const slot of [
      "checkbox",
      "checkbox-control",
      "checkbox-indicator",
      "checkbox-checkmark",
      "checkbox-indeterminate",
      "checkbox-content",
      "checkbox-label",
      "checkbox-description",
    ]) {
      expect(out).toContain(`data-slot="${slot}"`);
    }
    expect(out).toContain('role="checkbox"');
    noStyle(out);
  });

  test("no content without text", () => {
    expect(html(h(Checkbox, null))).not.toContain('data-slot="checkbox-content"');
  });

  test("checked, indeterminate, disabled and invalid states written as hooks by Base UI / invalid", () => {
    expect(html(h(Checkbox, { defaultChecked: true }, "x"))).toContain("data-checked");
    expect(html(h(Checkbox, { indeterminate: true }, "x"))).toContain("data-indeterminate");
    expect(html(h(Checkbox, { disabled: true }, "x"))).toContain("data-disabled");
    expect(html(h(Checkbox, { invalid: true }, "x"))).toContain("data-invalid");
  });

  test("variant on the label", () => {
    expect(html(h(Checkbox, { variant: "filled" }, "x"))).toContain('data-variant="filled"');
  });

  test("CheckboxGroup has a slot and orientation", () => {
    const out = html(h(CheckboxGroup, { orientation: "horizontal" }, h(Checkbox, null, "a")));
    expect(out).toContain('data-slot="checkbox-group"');
    expect(out).toContain('data-orientation="horizontal"');
  });
});

describe("Radio", () => {
  test("RadioGroup + Radio structure and hooks", () => {
    const out = html(
      h(
        RadioGroup,
        { defaultValue: "a" },
        h(Radio, { value: "a", description: "Details" }, "A"),
        h(Radio, { value: "b" }, "B"),
      ),
    );
    expect(out).toContain('role="radiogroup"');
    expect(out).toContain('data-slot="radio-group"');
    expect(out).toContain('data-orientation="vertical"');
    expect(out).toContain('data-slot="radio-control"');
    expect(out).toContain('data-slot="radio-indicator"');
    expect(out).toContain('data-slot="radio-description"');
    expect(out).toContain("data-checked");
    noStyle(out);
  });

  test("horizontal and variant", () => {
    const out = html(
      h(
        RadioGroup,
        { orientation: "horizontal", variant: "filled" },
        h(Radio, { value: "a" }, "A"),
      ),
    );
    expect(out).toContain('data-orientation="horizontal"');
    expect(out).toContain('data-variant="filled"');
  });
});

describe("Switch", () => {
  test("control, thumb and text each have a slot, md by default", () => {
    const out = html(h(Switch, { description: "Details" }, "Notifications"));
    for (const slot of [
      "switch",
      "switch-control",
      "switch-thumb",
      "switch-content",
      "switch-label",
      "switch-description",
    ]) {
      expect(out).toContain(`data-slot="${slot}"`);
    }
    expect(out).toContain('role="switch"');
    expect(out).toContain('data-size="md"');
    noStyle(out);
  });

  test("checked, size, disabled", () => {
    expect(html(h(Switch, { defaultChecked: true }, "x"))).toContain("data-checked");
    expect(html(h(Switch, { size: "lg" }, "x"))).toContain('data-size="lg"');
    expect(html(h(Switch, { disabled: true }, "x"))).toContain("data-disabled");
  });
});
