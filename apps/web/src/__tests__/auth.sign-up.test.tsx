import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import SignUp from "@/routes/_auth.sign-up";

describe("SignUp Component", () => {
  it("renders signup form elements", () => {
    render(<SignUp />);
    expect(screen.getByText("Create an account")).toBeInTheDocument();
    expect(screen.getByText("Sign up with Google")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Create Account/i }),
    ).toBeInTheDocument();
  });

  it("renders Google and Email options", () => {
    render(<SignUp />);
    expect(screen.getByText("Sign up with Google")).toBeInTheDocument();
    expect(screen.getByText(/Or continue with email/i)).toBeInTheDocument();
  });
});
