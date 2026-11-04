"use client";

import { useEffect, useState } from "react";
import { listManagedUsers } from "@/lib/api/admin";
import type { ManagedUserRow } from "@/lib/types";
import { CreateAccountForm } from "./create-account-form";
import { ManagedUsersList } from "./managed-users-list";

/**
 * Admin only: create accounts for other people and see where each stands.
 * Owns the list so that creating an account above refreshes it below.
 */
export function UsersTab() {
  // null until the first read answers; the list shows a skeleton meanwhile.
  const [users, setUsers] = useState<ManagedUserRow[] | null>(null);

  async function refresh() {
    setUsers(await listManagedUsers());
  }

  useEffect(() => {
    // State is set only after the query resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  return (
    <div className="space-y-6">
      <CreateAccountForm onCreated={refresh} />
      <ManagedUsersList
        users={users}
        onRefresh={refresh}
        onRemoved={(email) => setUsers((prev) => prev?.filter((u) => u.email !== email) ?? prev)}
      />
    </div>
  );
}
