import { permanentRedirect } from "next/navigation";

/** Старый URL: ведёт на общую страницу отзывов, блок доставки. */
export default function DeliveryReviewsRedirectPage() {
  permanentRedirect("/reviews#delivery");
}
