import React, { useState, useEffect, useMemo } from "react";
import { FaSort, FaSortUp, FaSortDown, FaFilter, FaTimes, FaSearch, FaFileExport } from "react-icons/fa";


const MultiFilterEventsTable = () => {
  const [events, setEvents] = useState([
    {
      id: 1,
      name: "Tech Conference 2024",
      date: new Date("2024-03-15"),
      location: "San Francisco",
      type: "Conference",
      status: "Upcoming"
    },
    {
      id: 2,
      name: "Product Launch",
      date: new Date("2024-02-28"),
      location: "New York",
      type: "Launch Event",
      status: "Completed"
    },
    {
      id: 3,
      name: "Digital Summit",
      date: new Date("2024-04-10"),
      location: "London",
      type: "Summit",
      status: "Planning"
    }
  ]);

  const [filters, setFilters] = useState({
    search: "",
    type: "",
    location: "",
    status: "",
    dateRange: {
      startDate: null,
      endDate: null
    }
  });

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: null
  });

  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [loading, setLoading] = useState(false);

  const eventTypes = [...new Set(events.map(event => event.type))];
  const locations = [...new Set(events.map(event => event.location))];
  const statuses = [...new Set(events.map(event => event.status))];

  const filteredEvents = useMemo(() => {
    setLoading(true);
    let result = [...events];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(event =>
        Object.values(event).some(
          value =>
            value &&
            value.toString().toLowerCase().includes(searchLower)
        )
      );
    }

    if (filters.type) {
      result = result.filter(event => event.type === filters.type);
    }

    if (filters.location) {
      result = result.filter(event => event.location === filters.location);
    }

    if (filters.status) {
      result = result.filter(event => event.status === filters.status);
    }

    if (filters.dateRange.startDate && filters.dateRange.endDate) {
      result = result.filter(
        event =>
          event.date >= filters.dateRange.startDate &&
          event.date <= filters.dateRange.endDate
      );
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    setLoading(false);
    return result;
  }, [events, filters, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(current => {
      if (current.key === key) {
        if (current.direction === "ascending") {
          return { key, direction: "descending" };
        }
        return { key: null, direction: null };
      }
      return { key, direction: "ascending" };
    });
  };

  const handleFilterChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      type: "",
      location: "",
      status: "",
      dateRange: {
        startDate: null,
        endDate: null
      }
    });
    setSortConfig({ key: null, direction: null });
  };

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      ["Name,Date,Location,Type,Status"].concat(
        filteredEvents.map(event =>
          `${event.name},${(event.date, "yyyy-MM-dd")},${event.location},${event.type},${event.status}`
        )
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "events.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Events Manager</h1>
        <label className="inline-flex items-center cursor-pointer">
          <span className="mr-3 text-sm font-medium text-gray-900">Filters</span>
          <div className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" value="" className="sr-only peer" 
              checked={isFilterExpanded}
              onChange={() => setIsFilterExpanded(!isFilterExpanded)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </div>
        </label>
      </div>

      {isFilterExpanded && (
        <div className="bg-white p-4 rounded-lg shadow space-y-4 transition-all">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Search</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder="Search events..."
                  className="pl-10 w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Event Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                {eventTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Location</label>
              <select
                value={filters.location}
                onChange={(e) => handleFilterChange("location", e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Locations</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              <FaTimes className="inline mr-2" />
              Clear Filters
            </button>
            <button
              onClick={exportData}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              <FaFileExport className="inline mr-2" />
              Export Data
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-4 text-center">Loading...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No events found matching your filters
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["name", "date", "location", "type", "status"].map(key => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center space-x-1">
                        <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                        {sortConfig.key === key ? (
                          sortConfig.direction === "ascending" ? (
                            <FaSortUp className="inline" />
                          ) : (
                            <FaSortDown className="inline" />
                          )
                        ) : (
                          <FaSort className="inline text-gray-400" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.map(event => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{event.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{event.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{event.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          event.status === "Upcoming"
                            ? "bg-green-100 text-green-800"
                            : event.status === "Completed"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};