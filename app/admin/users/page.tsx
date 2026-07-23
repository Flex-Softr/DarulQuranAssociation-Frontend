import Button from '../../../components/ui/Button';

export default function AdminUsersNew() {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm max-w-2xl">
      <h2 className="text-xl font-semibold mb-3">Create Admin User</h2>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input className="w-full rounded-lg border px-3 py-2" placeholder="Full name" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" className="w-full rounded-lg border px-3 py-2" placeholder="email@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" className="w-full rounded-lg border px-3 py-2" placeholder="••••••••" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <select className="w-full rounded-lg border px-3 py-2">
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
          </select>
        </div>
        <div className="md:col-span-2 flex justify-end gap-2 mt-2">
          <Button variant="secondary" type="reset">Reset</Button>
          <Button type="submit">Create</Button>
        </div>
      </form>
    </div>
  );
}


