import { gulimche } from "@/app/fonts";

const EventCardContent = ({ event }) => (
  <div
    className={`card-content flex-1 text-center xl:text-left max-w-2xl ${gulimche.className}`}
  >
    <p className="text-gray-300 text-sm sm:text-base lg:text-lg">
      [{event.date} {event.time}] {'{'}
    </p>
    <p className="pl-4 sm:pl-6 lg:pl-8 my-3 lg:my-4 text-cyan-400 text-base sm:text-lg lg:text-xl font-medium">
      {event.eventName}
    </p>
    <p className="mt-4 lg:mt-6 text-gray-300 text-sm sm:text-base lg:text-lg">
      [DESCRIPTION] {'{'}
    </p>
    <p className="pl-4 sm:pl-6 lg:pl-8 mt-3 lg:mt-4 text-gray-400 text-xs sm:text-sm lg:text-base leading-relaxed max-w-xl xl:max-w-none">
      {event.description}
    </p>
    <p className="text-gray-300 mt-3 lg:mt-4 text-sm sm:text-base lg:text-lg">{'}'}</p>
    <p className="text-gray-300 mt-2 text-sm sm:text-base lg:text-lg">{'}'}</p>
  </div>
);

export default EventCardContent;
