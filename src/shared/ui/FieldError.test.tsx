import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FieldError } from "./FieldError";

describe("FieldError", () => {
  it("renders nothing when there is no error", () => {
    const { container } = render(<FieldError error={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders a single error message", () => {
    render(<FieldError error="Name is required" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Name is required");
  });

  it("filters empty array messages and renders the rest", () => {
    render(<FieldError error={["Name is required", "", "Email is invalid"]} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Name is required");
    expect(screen.getByRole("alert")).toHaveTextContent("Email is invalid");
  });
});
