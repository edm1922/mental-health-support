"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("upcoming");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedSession, setSelectedSession] = useState(null);
  const [notes, setNotes] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/counseling/sessions");
      if (!response.ok) throw new Error("Failed to fetch sessions");
      const data = await response.json();
      setSessions(data);
    } catch (err) {
      setError("Failed to load sessions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "counselor") {
      fetchSessions();
    }
  }, [user]);

  const updateSessionStatus = async (sessionId, status) => {
    setUpdateLoading(true);
    try {
      const response = await fetch(`/api/counseling/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update session");
      fetchSessions();
    } catch (err) {
      setError("Failed to update session status");
      console.error(err);
    } finally {
      setUpdateLoading(false);
    }
  };

  const updateSessionNotes = async (sessionId) => {
    setUpdateLoading(true);
    try {
      const response = await fetch(
        `/api/counseling/sessions/${sessionId}/notes`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        }
      );
      if (!response.ok) throw new Error("Failed to update notes");
      fetchSessions();
      setSelectedSession(null);
    } catch (err) {
      setError("Failed to update session notes");
      console.error(err);
    } finally {
      setUpdateLoading(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#357AFF] border-t-transparent"></div>
      </div>
    );
  }

  if (!user || user.role !== "counselor") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">
            Access Denied
          </h1>
          <p className="mb-6 text-gray-600">
            This area is restricted to counselors only.
          </p>
          <a
            href="/"
            className="inline-block rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE]"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  const filteredSessions = sessions
    .filter((session) => {
      if (filter === "upcoming")
        return new Date(session.scheduledFor) > new Date();
      if (filter === "past") return new Date(session.scheduledFor) < new Date();
      return true;
    })
    .filter((session) => {
      if (dateFilter === "today") {
        const today = new Date().toDateString();
        return new Date(session.scheduledFor).toDateString() === today;
      }
      if (dateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(session.scheduledFor) > weekAgo;
      }
      return true;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            Counselor Dashboard
          </h1>
          <div className="flex flex-wrap gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-4 py-2 focus:border-[#357AFF] focus:outline-none"
            >
              <option value="all">All Sessions</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-4 py-2 focus:border-[#357AFF] focus:outline-none"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-500">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSessions.map((session) => (
            <div key={session.id} className="rounded-xl bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-lg font-semibold">
                  {new Date(session.scheduledFor).toLocaleDateString()}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-sm ${
                    session.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : session.status === "cancelled"
                      ? "bg-red-100 text-red-700"
                      : session.status === "ongoing"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {session.status}
                </span>
              </div>
              <div className="mb-4 space-y-2">
                <p className="text-gray-600">
                  <span className="font-semibold">Patient:</span>{" "}
                  {session.patientName}
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">Time:</span>{" "}
                  {new Date(session.scheduledFor).toLocaleTimeString()}
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">Type:</span> {session.type}
                </p>
              </div>
              <div className="space-y-2">
                <select
                  value={session.status}
                  onChange={(e) =>
                    updateSessionStatus(session.id, e.target.value)
                  }
                  disabled={updateLoading}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-[#357AFF] focus:outline-none"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={() => {
                    setSelectedSession(session);
                    setNotes(session.notes || "");
                  }}
                  className="w-full rounded-lg bg-[#357AFF] px-4 py-2 text-white hover:bg-[#2E69DE]"
                >
                  Update Notes
                </button>
              </div>
            </div>
          ))}
        </div>

        {selectedSession && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6">
              <h2 className="mb-4 text-xl font-bold">Update Session Notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mb-4 h-40 w-full rounded-lg border border-gray-200 p-3 focus:border-[#357AFF] focus:outline-none"
                placeholder="Enter session notes..."
              />
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setSelectedSession(null)}
                  className="rounded-lg border border-gray-200 px-4 py-2 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateSessionNotes(selectedSession.id)}
                  disabled={updateLoading}
                  className="rounded-lg bg-[#357AFF] px-4 py-2 text-white hover:bg-[#2E69DE]"
                >
                  {updateLoading ? "Saving..." : "Save Notes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainComponent;