import EventCardContent from "./EventCardContent";
import CardBorderSVG from "./CardBorder";
const EventCard = ({ event, index }) => (
  <div 
    className="timeline-card flex-shrink-0 w-screen h-screen flex items-center justify-center px-4 sm:px-8"
    data-index={index}
  >
    <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 items-center max-w-6xl mx-auto">
      {/* Card Image */}
      <div className="card-image w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[380px] h-[320px] sm:h-[380px] lg:h-[450px] flex-shrink-0">
        <CardBorderSVG imageUrl={event.image} altText={event.eventName} />
      </div>
      
      {/* Card Content */}
      <EventCardContent event={event} />
    </div>
  </div>
);

export default EventCard;
