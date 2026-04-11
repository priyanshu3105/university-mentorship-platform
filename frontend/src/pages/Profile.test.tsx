import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import Profile from "@/pages/Profile";

const apiGetMock = vi.fn();
const apiPutMock = vi.fn();

vi.mock("@/components/Navbar", () => ({
  default: () => <div data-testid="navbar" />,
}));

vi.mock("@/lib/api", () => ({
  apiGet: (...args: unknown[]) => apiGetMock(...args),
  apiPut: (...args: unknown[]) => apiPutMock(...args),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { email: "student@example.com" },
  }),
}));

describe("Profile page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGetMock.mockImplementation((path: string) => {
      if (path === "/profiles/me") {
        return Promise.resolve({
          id: "u1",
          fullName: "Student User",
          role: "student",
          createdAt: "",
          updatedAt: "",
        });
      }
      if (path === "/students/me") {
        return Promise.resolve({
          courseProgram: "BSc CS",
          interests: ["AI"],
        });
      }
      return Promise.resolve({});
    });
  });

  it("validates empty full name before save", async () => {
    render(<Profile />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Student User")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue("Student User"), {
      target: { value: "   " },
    });

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
    expect(apiPutMock).not.toHaveBeenCalled();
  });
});

