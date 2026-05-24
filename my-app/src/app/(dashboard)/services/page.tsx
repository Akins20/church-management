'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { serviceService } from '@/services';
import { Card, Loading, Button } from '@/components/common';
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

export default function ServiceCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => serviceService.getServices(1, 100),
  });

  const { data: upcomingServices } = useQuery({
    queryKey: ['upcomingServices'],
    queryFn: serviceService.getUpcomingServices,
  });

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentMonth);

  // Ensure services.data is an array
  const servicesList = Array.isArray(services?.data) ? services.data : [];

  const getServicesForDate = (day: number) => {
    return servicesList.filter((service) => {
      const serviceDate = new Date(service.date);
      return (
        serviceDate.getDate() === day &&
        serviceDate.getMonth() === currentMonth.getMonth() &&
        serviceDate.getFullYear() === currentMonth.getFullYear()
      );
    });
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) {
    return <Loading fullScreen text="Loading calendar..." />;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Service Calendar</h1>
        <p className="text-gray-600 mt-2">Browse upcoming services and events. Select a date to see what&apos;s scheduled.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">
                {currentMonth.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-gray-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before the first day */}
              {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}

              {/* Days of the month */}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const servicesOnDay = getServicesForDate(day);
                const isToday =
                  new Date().getDate() === day &&
                  new Date().getMonth() === currentMonth.getMonth() &&
                  new Date().getFullYear() === currentMonth.getFullYear();

                return (
                  <button
                    key={day}
                    onClick={() =>
                      setSelectedDate(
                        new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                      )
                    }
                    className={`aspect-square p-1 rounded-lg transition-colors ${
                      isToday
                        ? 'bg-blue-600 text-white'
                        : servicesOnDay && servicesOnDay.length > 0
                        ? 'bg-blue-50 hover:bg-blue-100'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="h-full flex flex-col">
                      <span
                        className={`text-sm font-medium ${
                          isToday ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {day}
                      </span>
                      {servicesOnDay && servicesOnDay.length > 0 && (
                        <div className="mt-1 flex justify-center">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isToday ? 'bg-white' : 'bg-blue-600'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Upcoming Services */}
        <div className="space-y-3">
          <Card title="Upcoming Services">
            <div className="space-y-4">
              {upcomingServices && upcomingServices.length > 0 ? (
                upcomingServices.slice(0, 5).map((service) => (
                  <div
                    key={service.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {service.theme || 'Sunday Service'}
                        </h4>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {new Date(service.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          service.completed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {service.completed ? 'Completed' : 'Upcoming'}
                      </span>
                    </div>
                    {service.attendanceCount && (
                      <div className="flex items-center text-sm text-gray-500 mt-2">
                        <UserGroupIcon className="h-4 w-4 mr-1" />
                        {service.attendanceCount} attended
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No upcoming services</p>
              )}
            </div>
          </Card>

          {/* Selected Date Info */}
          {selectedDate && (
            <Card
              title={selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            >
              {(() => {
                const servicesOnSelected = services?.data?.filter((service) => {
                  const serviceDate = new Date(service.date);
                  return (
                    serviceDate.getDate() === selectedDate.getDate() &&
                    serviceDate.getMonth() === selectedDate.getMonth() &&
                    serviceDate.getFullYear() === selectedDate.getFullYear()
                  );
                });

                return servicesOnSelected && servicesOnSelected.length > 0 ? (
                  <div className="space-y-3">
                    {servicesOnSelected.map((service) => (
                      <div key={service.id} className="p-3 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-900">
                          {service.theme || 'Sunday Service'}
                        </h4>
                        {service.announcements && (
                          <p className="text-sm text-gray-500 mt-1">{service.announcements}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No services on this date</p>
                );
              })()}
            </Card>
          )}

          {/* Legend */}
          <Card title="Legend">
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-blue-600 mr-2" />
                <span className="text-sm text-gray-600">Today</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-blue-100 mr-2 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                </span>
                <span className="text-sm text-gray-600">Has Service</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
