import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MentorsList from "@/pages/MentorsList";

const apiGetMock = vi.fn();

vi.mock("@/components/Navbar", () => ({
  default: () => <div data-testid="navbar" />,
}));

vi.mock("@/lib/api", () => ({
  apiGet: (...args: unknown[]) => apiGetMock(...args),
}));

describe("MentorsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGetMock.mockResolvedValue({
      items: [
        {
          id: "m1",
          fullName: "Dr. Sarah Chen",
          bio: "ML mentor",
          expertise: ["Machine Learning", "Python"],
          availabilityStatus: "available",
          photoUrl: "",
          averageRating: 4.8,
          ratingCount: 10,
          isApproved: true,
        },
      ],
    });
  });

  it("renders mentors returned by API", async () => {
    render(
      <MemoryRouter>
        <MentorsList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Dr. Sarah Chen")).toBeInTheDocument();
    });
    expect(apiGetMock).toHaveBeenCalled();
  });
});

