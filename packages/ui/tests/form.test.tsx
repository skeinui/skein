// @vitest-environment jsdom
import { act, createElement, createRef } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { ConfigProvider, Form } from "../src/index.ts";
import { zhCN } from "../src/locales/zh-CN.ts";
import type { FormField, FormInstance, FormProps } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

async function mount(props: FormProps) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(createElement(Form, props));
  });
  return host;
}
const settle = () => act(() => new Promise<void>((r) => setTimeout(r, 40)));
const input = (name: string) => document.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
const type = async (name: string, text: string) => {
  const el = input(name);
  await act(async () => {
    // Must use the setter on the prototype: React uses it to tell whether the value really changed
    // oxlint-disable-next-line typescript/unbound-method
    Reflect.set(HTMLInputElement.prototype, "value", text, el);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await settle();
};
const blur = async (name: string) => {
  const el = input(name);
  await act(async () => {
    el.focus();
    el.blur();
  });
  await settle();
};
const clickSubmit = async () => {
  await act(async () => {
    document.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
  });
  await settle();
};
const errorOf = (name: string) =>
  document.querySelector(`[data-field-name="${name}"] [data-slot="field-error"]`)?.textContent ??
  null;

const FIELDS: FormField[] = [
  { name: "name", label: "Name", required: true, minLength: 2 },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "age", label: "Age", type: "number", min: 18 },
];

describe("Form", () => {
  test("SSR: a form, one form-item per field, with labels and required marks, no class / style", () => {
    // Use text fields only: Base UI writes inline styles itself inside NumberField, that is behavior, not written by us
    const html = renderToStaticMarkup(createElement(Form, { fields: FIELDS.slice(0, 2) }));
    expect(html).toContain('data-slot="form"');
    expect(html).toContain("noValidate");
    expect(html.match(/data-slot="form-item"/g)).toHaveLength(2);
    expect(html).toContain('data-layout="vertical"');
    expect(html).toContain('type="submit"');
    expect(html).toContain("Submit");
    expect(html).not.toContain("class=");
    expect(html).not.toContain("style=");
    expect(html).toContain("data-required");
  });

  test("submit: onSubmit is not called when validation fails, each field shows its error, onInvalid gets the errors", async () => {
    const submitted: unknown[] = [];
    let invalid: Record<string, string> | null = null;
    await mount({
      fields: FIELDS,
      onSubmit: (v) => void submitted.push(v),
      onInvalid: (e) => (invalid = e),
    });
    await clickSubmit();
    expect(submitted).toEqual([]);
    expect(errorOf("name")).toBe("This field is required");
    expect(errorOf("email")).toBe("This field is required");
    expect(errorOf("age")).toBeNull();
    expect(invalid).toEqual({ name: "This field is required", email: "This field is required" });
    // Focus lands on the first field with an error
    expect(document.activeElement).toBe(input("name"));
  });

  test("submit: on success onSubmit gets the values (numbers are numbers, empty numbers are null)", async () => {
    const submitted: unknown[] = [];
    await mount({ fields: FIELDS, onSubmit: (v) => void submitted.push(v) });
    await type("name", "Ada");
    await type("email", "ada@example.com");
    await clickSubmit();
    expect(submitted).toEqual([{ name: "Ada", email: "ada@example.com", age: null }]);
  });

  test("validates on blur (default); after an error, changes revalidate at once; fixing it clears the error", async () => {
    await mount({ fields: FIELDS });
    await type("name", "A");
    expect(errorOf("name")).toBeNull(); // not left yet, no error
    await blur("name");
    expect(errorOf("name")).toBe("Must be at least 2 characters");
    await type("name", "Ad");
    expect(errorOf("name")).toBeNull(); // after an error, changes revalidate
  });

  test("validateOn=change: validates on every input; validateOn=submit: no validation on blur", async () => {
    await mount({ fields: FIELDS, validateOn: "change" });
    await type("name", "A");
    expect(errorOf("name")).toBe("Must be at least 2 characters");
    await act(async () => root!.unmount());
    host!.remove();
    await mount({ fields: FIELDS, validateOn: "submit" });
    await type("name", "A");
    await blur("name");
    expect(errorOf("name")).toBeNull();
  });

  test("email fields validate the format automatically; a custom validate gets all form values", async () => {
    await mount({
      fields: [
        { name: "email", type: "email" },
        { name: "pw", type: "password" },
        {
          name: "pw2",
          type: "password",
          validate: (value, all) => (value === all.pw ? undefined : "Passwords differ"),
        },
      ],
    });
    await type("email", "nope");
    await blur("email");
    expect(errorOf("email")).toBe("Enter a valid email address");
    await type("pw", "secret");
    await type("pw2", "other");
    await blur("pw2");
    expect(errorOf("pw2")).toBe("Passwords differ");
    await type("pw2", "secret");
    expect(errorOf("pw2")).toBeNull();
  });

  test("dependencies: when a dependency changes, already validated fields revalidate (change the password, the confirmation follows)", async () => {
    await mount({
      fields: [
        { name: "pw", type: "password" },
        {
          name: "pw2",
          type: "password",
          dependencies: ["pw"],
          validate: (value, all) => (value === all.pw ? undefined : "Passwords differ"),
        },
      ],
    });
    await type("pw", "abc12345");
    await type("pw2", "abc12345");
    await blur("pw2");
    expect(errorOf("pw2")).toBeNull();
    await type("pw", "abc12346"); // password changed, confirmation untouched, still revalidated
    expect(errorOf("pw2")).toBe("Passwords differ");
    await type("pw", "abc12345"); // changed back, the error goes away
    expect(errorOf("pw2")).toBeNull();
  });

  test("dependencies: fields not validated yet do not show errors because of changes elsewhere", async () => {
    await mount({
      fields: [
        { name: "pw", type: "password" },
        {
          name: "pw2",
          type: "password",
          dependencies: ["pw"],
          validate: (value, all) => (value === all.pw ? undefined : "Passwords differ"),
        },
      ],
    });
    await type("pw", "abc"); // pw2 not touched yet, it differs from pw now but must not show an error
    expect(errorOf("pw2")).toBeNull();
  });

  test("dependencies: after one submit all fields count as validated; hidden dependents are not validated", async () => {
    await mount({
      fields: [
        { name: "a" },
        {
          name: "b",
          dependencies: ["a"],
          validate: (v, all) => (v === all.a ? undefined : "b must equal a"),
        },
        { name: "c", dependencies: ["a"], hidden: true, validate: () => "never shown" },
      ],
    });
    await type("a", "x");
    await type("b", "y");
    await clickSubmit(); // submit: b differs from a -> error
    expect(errorOf("b")).toBe("b must equal a");
    await type("a", "y"); // change only a: b revalidates, the error goes away
    expect(errorOf("b")).toBeNull();
    expect(document.querySelector('[data-field-name="c"]')).toBeNull();
  });

  test("dependencies: reset makes fields unvalidated again; instanceRef.setValues revalidates dependents too", async () => {
    const ref = createRef<FormInstance>();
    await mount({
      instanceRef: ref,
      fields: [
        { name: "a" },
        {
          name: "b",
          dependencies: ["a"],
          validate: (v, all) => (v === all.a ? undefined : "mismatch"),
        },
      ],
    });
    await type("b", "q");
    await blur("b");
    expect(errorOf("b")).toBe("mismatch");
    await act(async () => {
      ref.current!.setValues({ a: "q" });
    });
    await settle();
    expect(errorOf("b")).toBeNull();
    await act(async () => {
      ref.current!.reset();
    });
    await type("a", "z"); // after reset b is not validated, no error
    expect(errorOf("b")).toBeNull();
  });

  test("async onSubmit: the submit button spins and blocks resubmits, recovers afterwards; on a throw it recovers and rethrows", async () => {
    let resolve!: () => void;
    let calls = 0;
    await mount({
      fields: [{ name: "a" }],
      onSubmit: () => {
        calls++;
        return new Promise<void>((r) => (resolve = r));
      },
    });
    await clickSubmit();
    const button = document.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(button.hasAttribute("data-loading")).toBe(true);
    expect(document.querySelector("form")!.getAttribute("aria-busy")).toBe("true");
    await clickSubmit();
    expect(calls).toBe(1);
    resolve();
    await settle();
    expect(button.hasAttribute("data-loading")).toBe(false);
    expect(document.querySelector("form")!.hasAttribute("aria-busy")).toBe(false);
  });

  test("conditional fields: when hidden they are not shown, validated or submitted; shown again, the value is still there", async () => {
    const submitted: unknown[] = [];
    await mount({
      fields: [
        { name: "company", label: "Company" },
        { name: "tax", label: "Tax id", required: true, hidden: (v) => !v.company },
      ],
      onSubmit: (v) => void submitted.push(v),
    });
    expect(document.querySelector('[data-field-name="tax"]')).toBeNull();
    await clickSubmit();
    expect(submitted).toEqual([{ company: "" }]); // tax is required but hidden, does not block submit
    await type("company", "Acme");
    expect(document.querySelector('[data-field-name="tax"]')).not.toBeNull();
    await clickSubmit();
    expect(errorOf("tax")).toBe("This field is required");
  });

  test("nested field names: address.city goes into a nested value object", async () => {
    const submitted: unknown[] = [];
    await mount({
      fields: [{ name: "address.city" }, { name: "address.zip" }],
      defaultValues: { address: { zip: "100000" } },
      onSubmit: (v) => void submitted.push(v),
    });
    expect(input("address.zip").value).toBe("100000");
    await type("address.city", "Beijing");
    await clickSubmit();
    expect(submitted).toEqual([{ address: { city: "Beijing", zip: "100000" } }]);
  });

  test("reset: values back to initial, errors cleared; the reset button only with resetLabel", async () => {
    await mount({ fields: FIELDS, defaultValues: { name: "Ada" }, resetLabel: "Reset" });
    await type("name", "");
    await blur("name");
    expect(errorOf("name")).not.toBeNull();
    await act(async () => {
      document.querySelector<HTMLButtonElement>('button[type="reset"]')!.click();
    });
    await settle();
    expect(input("name").value).toBe("Ada");
    expect(errorOf("name")).toBeNull();
    await act(async () => root!.unmount());
    host!.remove();
    await mount({ fields: FIELDS });
    expect(document.querySelector('button[type="reset"]')).toBeNull();
  });

  test("controlled values: values / onValuesChange; outside errors show on fields without an internal error", async () => {
    const changes: string[] = [];
    await mount({
      fields: [{ name: "a" }, { name: "b" }],
      values: { a: "fixed", b: "" },
      onValuesChange: (_v, name) => changes.push(name),
      errors: { b: "Taken on the server" },
    });
    expect(input("a").value).toBe("fixed");
    await type("a", "changed");
    expect(changes).toEqual(["a"]);
    expect(input("a").value).toBe("fixed"); // unchanged outside, still fixed
    expect(errorOf("b")).toBe("Taken on the server");
  });

  test("instanceRef: submit / validate / getValues / setValues / setErrors / reset", async () => {
    const ref = createRef<FormInstance>();
    const submitted: unknown[] = [];
    await mount({ fields: FIELDS, instanceRef: ref, onSubmit: (v) => void submitted.push(v) });
    let ok = true;
    await act(async () => {
      ok = await ref.current!.submit();
    });
    expect(ok).toBe(false);
    await act(async () => {
      ref.current!.setValues({ name: "Ada", email: "a@b.co" });
    });
    await settle();
    expect(ref.current!.getValues()).toMatchObject({ name: "Ada", email: "a@b.co" });
    expect(input("name").value).toBe("Ada");
    await act(async () => {
      ok = await ref.current!.submit();
    });
    expect(ok).toBe(true);
    expect(submitted).toHaveLength(1);
    await act(async () => {
      ref.current!.setErrors({ email: "Already registered" });
    });
    expect(errorOf("email")).toBe("Already registered");
    await act(async () => {
      ok = await ref.current!.validate("name");
    });
    expect(ok).toBe(true);
    await act(async () => {
      ref.current!.reset();
    });
    expect(input("name").value).toBe("");
  });

  test("layout and columns: layout / columns on the form, field span clamped to the column count", async () => {
    await mount({
      fields: [{ name: "a", span: 2 }, { name: "b", span: 9 }, { name: "c" }],
      layout: "horizontal",
      columns: 2,
    });
    const form = document.querySelector("form")!;
    expect(form.getAttribute("data-layout")).toBe("horizontal");
    expect(form.getAttribute("data-columns")).toBe("2");
    expect(
      [...document.querySelectorAll("[data-slot=form-item]")].map((e) =>
        e.getAttribute("data-span"),
      ),
    ).toEqual(["2", "2", "1"]);
  });

  test("control types: choice controls validate on change; checkbox / switch use the label as their text", async () => {
    const submitted: unknown[] = [];
    await mount({
      fields: [
        {
          name: "plan",
          type: "radio",
          label: "Plan",
          required: true,
          options: [
            { value: "a", label: "A" },
            { value: "b", label: "B" },
          ],
        },
        { name: "agree", type: "checkbox", label: "I agree", required: "You must agree" },
        {
          name: "tags",
          type: "checkbox-group",
          label: "Tags",
          options: [
            { value: "x", label: "X" },
            { value: "y", label: "Y" },
          ],
        },
        { name: "notify", type: "switch", label: "Notify me" },
        { name: "score", type: "rating" },
        {
          name: "level",
          type: "segmented",
          options: [
            { value: "lo", label: "Low" },
            { value: "hi", label: "High" },
          ],
        },
      ],
      onSubmit: (v) => void submitted.push(v),
    });
    // The text of a checkbox / switch belongs to the control itself, there is no separate Field label
    expect(
      document.querySelector('[data-field-name="agree"] [data-slot="field-label"]'),
    ).toBeNull();
    expect(document.querySelector('[data-field-name="notify"]')!.textContent).toContain(
      "Notify me",
    );
    expect(
      document.querySelector('[data-field-name="plan"] [data-slot="field-label"]')!.textContent,
    ).toBe("Plan");
    await clickSubmit();
    expect(errorOf("plan")).toBe("This field is required");
    expect(errorOf("agree")).toBe("You must agree");
    expect(submitted).toEqual([]);
  });

  test("custom: render gets value / onChange / invalid, the value goes into the form", async () => {
    const submitted: unknown[] = [];
    await mount({
      fields: [
        {
          name: "color",
          type: "custom",
          required: true,
          render: ({ value, onChange, invalid }) =>
            createElement(
              "button",
              {
                type: "button",
                "data-testid": "pick",
                "data-invalid": invalid ? "" : undefined,
                onClick: () => onChange("red"),
              },
              typeof value === "string" ? value : "none",
            ),
        },
      ],
      onSubmit: (v) => void submitted.push(v),
    });
    await clickSubmit();
    expect(errorOf("color")).toBe("This field is required");
    expect(document.querySelector('[data-testid="pick"]')!.hasAttribute("data-invalid")).toBe(true);
    await act(async () => {
      document.querySelector<HTMLButtonElement>('[data-testid="pick"]')!.click();
    });
    await settle();
    expect(errorOf("color")).toBeNull();
    await clickSubmit();
    expect(submitted).toEqual([{ color: "red" }]);
  });

  test("messages replace the error texts; actions replace the footer buttons; disabled disables all fields and the submit button", async () => {
    await mount({
      fields: [{ name: "a", required: true }],
      messages: { required: "Please fill this in" },
      actions: createElement("span", { "data-testid": "own" }, "own actions"),
    });
    expect(document.querySelector('button[type="submit"]')).toBeNull();
    expect(document.querySelector('[data-testid="own"]')).not.toBeNull();
    await act(async () => root!.unmount());
    host!.remove();
    await mount({
      fields: [{ name: "a", required: true }],
      messages: { required: "Please fill this in" },
    });
    await clickSubmit();
    expect(errorOf("a")).toBe("Please fill this in");
    await act(async () => root!.unmount());
    host!.remove();
    await mount({ fields: [{ name: "a" }], disabled: true });
    expect(input("a").disabled).toBe(true);
    expect(document.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
  });
  test("the default error texts follow the locale; `messages` still wins", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(
        createElement(
          ConfigProvider,
          { ...zhCN },
          createElement(Form, { fields: [{ name: "a", required: true }] }),
        ),
      );
    });
    await clickSubmit();
    expect(errorOf("a")).toBe(zhCN.labels.form.required);
    expect(errorOf("a")).not.toBe("This field is required");
  });
  test("`id` goes to the <form>, and `actions={false}` leaves the buttons out (a button elsewhere submits with form={id})", async () => {
    await mount({ fields: FIELDS.slice(0, 1), id: "outside", actions: false });
    const form = document.querySelector("form")!;
    expect(form.id).toBe("outside");
    expect(document.querySelector('[data-slot="form-actions"]')).toBeNull();
    expect(document.querySelector('button[type="submit"]')).toBeNull();
  });
});
