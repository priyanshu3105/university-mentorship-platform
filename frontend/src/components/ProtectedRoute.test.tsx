import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

function renderWithRoutes(initialPath: string, routeElement: ReactNode) {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        <Route path="/complete-registration" element={<div>Complete Registration Page</div>} />
        <Route path="/admin" element={routeElement} />
        <Route path="/app" element={routeElement} />
      </Routes>
    </MemoryRouter>,
  );
}

function mockAuthState(partial: Partial<ReturnType<typeof useAuth>>) {
  mockedUseAuth.mockReturnValue({
    session: null,
    user: null,
    profile: null,
    loading: false,
    refreshProfile: vi.fn(),
    signOut: vi.fn(),
    ...partial,
  });
}

describe("ProtectedRoute RBAC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to login", () => {
    mockAuthState({ session: null });

    renderWithRoutes(
      "/app",
      <ProtectedRoute>
        <div>App Page</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("redirects authenticated users without profile to complete registration", () => {
    mockAuthState({
      session: { access_token: "token" } as never,
      profile: {
        id: "u1",
        email: "new@example.com",
        fullName: "",
        role: "student",
        profileExists: false,
        mentor: null,
      },
    });

    renderWithRoutes(
      "/app",
      <ProtectedRoute>
        <div>App Page</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText("Complete Registration Page")).toBeInTheDocument();
  });

  it("blocks non-admin users from admin-only routes", () => {
    mockAuthState({
      session: { access_token: "token" } as never,
      profile: {
        id: "u2",
        email: "student@example.com",
        fullName: "Student User",
        role: "student",
        profileExists: true,
        mentor: null,
      },
    });

    renderWithRoutes(
      "/admin",
      <ProtectedRoute allowedRoles={["admin"]}>
        <div>Admin Page</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
  });

  it("allows admin users on admin-only routes", () => {
    mockAuthState({
      session: { access_token: "token" } as never,
      profile: {
        id: "a1",
        email: "admin@example.com",
        fullName: "Admin User",
        role: "admin",
        profileExists: true,
        mentor: null,
      },
    });

    renderWithRoutes(
      "/admin",
      <ProtectedRoute allowedRoles={["admin"]}>
        <div>Admin Page</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText("Admin Page")).toBeInTheDocument();
  });
});
