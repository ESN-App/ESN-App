using EsnApp.Domain.Discounts;

namespace EsnApp.Infrastructure.Persistence;

internal static class PartnerSeedData
{
    public static IReadOnlyList<Partner> Create()
    {
        Partner[] partners =
        [
        CreatePartner(
            "McDonald's",
            "Fast-food restaurant with familiar favourites.",
            "International restaurant chain serving burgers, wraps, breakfast items, drinks and desserts.",
            "Długa 18, 80-827 Gdańsk",
            54.348570m,
            18.652950m,
            [
                ("15% off the food menu", "Valid with a current ESNcard. Drinks and lunch specials are excluded."),
                ("Free soft drink with a main course", "One free soft drink per person when ordering a main course."),
            ]),
        CreatePartner(
            "Starbucks",
            "Specialty coffee shop popular with students.",
            "A quiet café suitable for studying, with specialty coffee, tea and freshly baked pastries.",
            "Ogarna 42, 80-826 Gdańsk",
            54.346940m,
            18.650620m,
            [
                ("10% off every order", "Valid for the cardholder on drinks and food purchased in the café."),
            ]),
        CreatePartner(
            "Fitness First",
            "Modern gym with group classes and a sauna.",
            "A student-friendly fitness club offering strength and cardio zones, classes and wellness facilities.",
            "Grunwaldzka 82, 80-244 Gdańsk",
            54.378040m,
            18.604250m,
            [
                ("20% off a monthly membership", "Applies to the standard monthly membership upon presentation of an ESNcard."),
                ("Free first group class", "Advance booking is required and places are subject to availability."),
            ]),
        CreatePartner(
            "EF Education First",
            "Language courses and conversation workshops.",
            "A language school providing Polish, English and German classes in small international groups.",
            "Wały Jagiellońskie 8, 80-887 Gdańsk",
            54.352410m,
            18.646980m,
            [
                ("15% off a language course", "Valid for one semester course. Cannot be combined with other promotions."),
            ]),
        CreatePartner(
            "Decathlon",
            "Sports equipment, clothing and accessories.",
            "International sports retailer with equipment and apparel for cycling, water sports, fitness and outdoor activities.",
            "Żabi Kruk 15, 80-822 Gdańsk",
            54.342910m,
            18.648940m,
            [
                ("10% off selected sports equipment", "Example development offer shown only to test the partner layout."),
                ("Free equipment consultation", "Availability and conditions are placeholder data."),
            ]),
        CreatePartner(
            "a&o Hostels",
            "Affordable accommodation in central Gdańsk.",
            "A friendly hostel with shared and private rooms, a common kitchen and luggage storage.",
            "Podwale Staromiejskie 62, 80-844 Gdańsk",
            54.355880m,
            18.651310m,
            [
                ("12% off direct reservations", "Book directly through the hostel website and show your ESNcard at check-in."),
            ]),
        CreatePartner(
            "Subway",
            "Made-to-order sandwiches, wraps and salads.",
            "International quick-service restaurant offering customisable sandwiches, wraps, salads and snacks.",
            "Garncarska 7, 80-894 Gdańsk",
            54.353610m,
            18.645290m,
            [
                ("10% off the regular menu", "Example development offer shown only to test the partner layout."),
                ("Free extra topping", "Availability and conditions are placeholder data."),
            ]),
        CreatePartner(
            "Nextbike",
            "City and trekking bicycle rental.",
            "Bicycle rental with helmets, locks and basic route advice for trips around the Tricity.",
            "Kartuska 25, 80-103 Gdańsk",
            54.351180m,
            18.632870m,
            [
                ("15% off bicycle rental", "Valid for rentals lasting from one day to one week."),
            ]),
        CreatePartner(
            "Multikino",
            "Independent cinema showing international films.",
            "A small cinema presenting new releases, classics and English-subtitled screenings.",
            "Bohaterów Monte Cassino 30, 81-759 Sopot",
            54.442930m,
            18.563820m,
            [
                ("Student ticket for 18 PLN", "Valid for standard screenings from Monday to Thursday."),
                ("Free small popcorn on Tuesdays", "Available with an ESNcard and a cinema ticket purchased for the same screening."),
            ]),
        CreatePartner(
            "Ryanair",
            "Low-cost flights across Europe.",
            "European airline serving Gdańsk with direct routes to many popular student destinations.",
            "Juliusza Słowackiego 200, 80-298 Gdańsk",
            54.351960m,
            18.654450m,
            [
                ("Student travel offer", "Example development offer shown only to test the partner layout."),
            ]),
        CreatePartner(
            "Adidas",
            "Sportswear, footwear and accessories.",
            "International sports brand offering footwear, apparel and equipment for training and everyday use.",
            "Targ Sienny 7, 80-806 Gdańsk",
            54.422310m,
            18.602880m,
            [
                ("15% off selected products", "Example development offer shown only to test the partner layout."),
                ("Student collection offer", "Availability and conditions are placeholder data."),
            ]),
        CreatePartner(
            "Empik",
            "Bookshop with English-language titles and stationery.",
            "An independent bookstore carrying fiction, travel guides, language-learning materials and gifts.",
            "Piwna 31, 80-831 Gdańsk",
            54.349810m,
            18.652290m,
            [
                ("10% off books", "Applies to regular-priced books. Textbooks and special orders are excluded."),
            ]),
        CreatePartner(
            "LEGO",
            "Creative building sets, gifts and collectibles.",
            "The LEGO brand offers building sets and creative products for a wide range of ages and interests.",
            "al. Grunwaldzka 141, 80-264 Gdańsk",
            54.516920m,
            18.539880m,
            [
                ("10% off selected sets", "Example development offer shown only to test the partner layout."),
                ("Student gift with purchase", "Availability and conditions are placeholder data."),
            ]),
        CreatePartner(
            "L'Oréal",
            "Beauty, haircare and cosmetics.",
            "International beauty brand offering haircare, skincare, cosmetics and personal-care products.",
            "al. Grunwaldzka 141, 80-264 Gdańsk",
            54.381980m,
            18.606890m,
            [
                ("15% off selected products", "Example development offer shown only to test the partner layout."),
            ]),
        CreatePartner(
            "Xerox",
            "Printing, copying and binding services.",
            "A convenient print point for university assignments, posters, photographs and document binding.",
            "Do Studzienki 16, 80-227 Gdańsk",
            54.371010m,
            18.612990m,
            [
                ("10% off printing and copying", "Valid for orders placed in person. Minimum order value is 10 PLN."),
                ("20% off document binding", "Applies to standard comb and thermal binding."),
            ]),
        ];

        for (var index = 0; index < partners.Length; index++)
        {
            partners[index].DisplayOrder = index;
        }

        return partners;
    }

    private static Partner CreatePartner(
        string name,
        string shortDescription,
        string description,
        string address,
        decimal latitude,
        decimal longitude,
        IReadOnlyList<(string Title, string Description)> discounts)
    {
        var logoFile = name switch
        {
            "McDonald's" => "mcdonalds.png",
            "Starbucks" => "starbucks.png",
            "Fitness First" => "fitness-first.png",
            "EF Education First" => "ef-education-first.png",
            "Decathlon" => "decathlon.png",
            "a&o Hostels" => "ao-hostels.png",
            "Subway" => "subway.png",
            "Nextbike" => "nextbike.png",
            "Multikino" => "multikino.png",
            "Ryanair" => "ryanair.png",
            "Adidas" => "adidas.png",
            "Empik" => "empik.png",
            "LEGO" => "lego.png",
            "L'Oréal" => "loreal.png",
            "Xerox" => "xerox.png",
            _ => "placeholder.png",
        };

        var websiteUrl = name switch
        {
            "McDonald's" => "https://mcdonalds.pl",
            "Starbucks" => "https://www.starbucks.pl",
            "Fitness First" => "https://www.fitnessfirst.com",
            "EF Education First" => "https://www.ef.pl",
            "Decathlon" => "https://www.decathlon.pl",
            "a&o Hostels" => "https://www.aohostels.com",
            "Subway" => "https://www.subway.com",
            "Nextbike" => "https://nextbike.pl",
            "Multikino" => "https://multikino.pl",
            "Ryanair" => "https://www.ryanair.com",
            "Adidas" => "https://www.adidas.pl",
            "Empik" => "https://www.empik.com",
            "LEGO" => "https://www.lego.com",
            "L'Oréal" => "https://www.loreal.com",
            "Xerox" => "https://www.xerox.com",
            _ => "https://example.com",
        };
        var partner = new Partner
        {
            Name = name,
            LogoPath = $"/api/images/partners/{logoFile}",
            ShortDescription = shortDescription,
            Description = description,
            Address = address,
            WebsiteUrl = new Uri(websiteUrl),
            GoogleMapsUrl = new Uri($"https://maps.google.com/?q={latitude},{longitude}"),
            Latitude = latitude,
            Longitude = longitude,
            Status = PartnerStatus.Active,
        };

        foreach (var (title, discountDescription) in discounts.Take(2))
        {
            partner.Discounts.Add(new Discount
            {
                Title = title,
                Description = discountDescription,
                Partner = partner,
            });
        }

        return partner;
    }
}
