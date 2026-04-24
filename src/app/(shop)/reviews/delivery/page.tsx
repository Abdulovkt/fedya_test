import { permanentRedirect } from "next/navigation";

/** Старый URL: ведёт на общую страницу отзывов. */
export default function DeliveryReviewsRedirectPage() {
  permanentRedirect("/reviews");
}
