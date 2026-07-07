import React from 'react';
import { EventContentArg } from '@fullcalendar/core';

export const renderEventContent = (eventInfo: EventContentArg) => {
  const { event } = eventInfo;
  const props = event.extendedProps;
  
  return (
    <div className="p-1 overflow-hidden text-xs leading-tight">
      <div className="font-semibold truncate">{event.title}</div>
      {props.room && (
        <div className="text-[10px] opacity-90 truncate">
          Salle: {props.room}
        </div>
      )}
      {props.session_type && (
        <div className="text-[10px] opacity-90 uppercase font-bold">
          {props.session_type}
        </div>
      )}
      {props.seat_number && (
        <div className="text-[10px] opacity-90">
          Place: {props.seat_number}
        </div>
      )}
    </div>
  );
};
