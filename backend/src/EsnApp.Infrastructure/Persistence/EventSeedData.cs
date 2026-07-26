using EsnApp.Domain.Events;

namespace EsnApp.Infrastructure.Persistence;

/// <summary>
/// Realistic development fixtures used to exercise event list and details layouts.
/// Dates are authored in Gdańsk summer time and converted to UTC for PostgreSQL.
/// </summary>
internal static class EventSeedData
{
    public static IReadOnlyList<Event> Create() =>
    [
        // July — 12 events
        Build(
            "Beach Volleyball Kickoff",
            "A relaxed tournament for beginners and experienced players.",
            "Start July with sand, music, and friendly competition at Brzeźno Beach. "
                + "We will create mixed international teams on arrival, so you can register alone. "
                + "The format is casual and every team plays several short matches. Bring water, sunscreen, and clothes suitable for the weather.",
            "Brzeźno Beach, entrance 50",
            At(7, 2, 17),
            At(7, 2, 20),
            currentParticipants: 24,
            maximumParticipants: 32,
            imagePath: Image("photo-1592656094267-764a45160876"),
            registrationUrl: Register("beach-volleyball-kickoff")),

        Build(
            "Sunset Kayak on the Motława",
            "See the historic waterfront from the water at golden hour.",
            "A guided evening paddle through the quieter canals of Gdańsk. No previous kayaking experience is required; "
                + "the instructor will explain the equipment and basic technique before departure. The ticket includes a kayak, paddle, life jacket, and waterproof bag.",
            "Kayakowa 15, Gdańsk",
            At(7, 5, 18, 30),
            At(7, 5, 21),
            price: 45m,
            minimumParticipants: 6,
            currentParticipants: 16,
            maximumParticipants: 16,
            imagePath: Image("photo-1544551763-46a013bb70d5"),
            registrationUrl: Register("sunset-kayak")),

        Build(
            "Polish Survival Workshop",
            "Learn the Polish phrases that make everyday life much easier.",
            "A practical introduction to greetings, shopping, public transport, ordering food, and asking for help. "
                + "You will leave with a small phrase sheet and enough confidence to survive your first week.",
            "ESN Office, Wita Stwosza 58",
            At(7, 8, 18),
            At(7, 8, 19, 30),
            maximumParticipants: 50,
            registrationUrl: Register("polish-survival-workshop")),

        Build(
            "Pierogi Cooking Night",
            "Cook, fold, and eat Poland's most famous comfort food.",
            "During this hands-on workshop we will prepare two fillings: a classic potato-and-cheese version and a seasonal vegan option. "
                + "Local cooks will show you how to make soft dough, seal pierogi properly, and avoid the small disasters that usually happen during a first attempt.\n\n"
                + "After cooking, everyone sits down at one long table to share the meal. Ingredients, aprons, recipes, tea, and plenty of sour cream are included. "
                + "Please mention allergies during registration.",
            "Culinary Studio, Stary Rynek Oliwski 7",
            At(7, 11, 17),
            At(7, 11, 20),
            price: 35m,
            minimumParticipants: 10,
            currentParticipants: 19,
            maximumParticipants: 24,
            imagePath: Image("photo-1556911220-bff31c812dba"),
            registrationUrl: Register("pierogi-cooking-night")),

        Build(
            "Oliwa Park Picnic",
            "Blankets, snacks, and an easy afternoon in the park.",
            "Bring something small to share and join us under the old trees.",
            "Oliwa Park, main gate",
            At(7, 14, 14)),

        Build(
            "Board Game Night",
            "A table full of quick games, strategy games, and new people.",
            "Choose from party games, cooperative adventures, and longer strategy titles. Volunteers will explain the rules, "
                + "and tables will be arranged by game length so it is easy to join even if you arrive later.",
            "Młody Byron, Jesionowa 18",
            At(7, 17, 19),
            At(7, 17, 23),
            price: 5m,
            currentParticipants: 41,
            maximumParticipants: 60,
            imagePath: Image("photo-1610890716171-6b1bb98ffd09")),

        Build(
            "Hel Peninsula Day Trip",
            "A full day of beaches, seals, cycling, and Baltic views.",
            "We take an early train to Hel and begin with a walk through the harbour and the seal sanctuary. "
                + "After lunch, choose between free beach time and an optional bicycle route through the coastal forest. "
                + "The pace is comfortable, but the day is long, so bring a jacket, water, and shoes you can walk in. "
                + "The fee covers return transport, sanctuary entry, and a local coordinator.",
            "Meeting point: Gdańsk Główny",
            At(7, 20, 7),
            At(7, 20, 21),
            price: 80m,
            minimumParticipants: 20,
            currentParticipants: 47,
            maximumParticipants: 50,
            imagePath: Image("photo-1507525428034-b723cf961d3e"),
            registrationUrl: Register("hel-day-trip")),

        Build(
            "International Karaoke",
            "Sing one song, sing ten songs, or simply cheer for everyone.",
            "A low-pressure karaoke night with songs in every language. Entry includes one soft drink.",
            "Student Club Żak, Grunwaldzka 195",
            At(7, 22, 20),
            At(7, 23, 1),
            price: 10m,
            registrationUrl: Register("international-karaoke")),

        Build(
            "Baltic Beach Cleanup",
            "Spend a useful morning together and leave the beach cleaner.",
            "We provide gloves, reusable collection bags, waste sorting guidance, and coffee after the cleanup. "
                + "The activity goes ahead in light rain, but severe weather may change the date.",
            "Jelitkowo Beach, entrance 72",
            At(7, 25, 9),
            At(7, 25, 12),
            currentParticipants: 36,
            maximumParticipants: 100,
            imagePath: Image("photo-1618477461853-cf6ed80faba5")),

        Build(
            "Stutthof Museum Study Visit",
            "A guided educational visit to the former concentration camp.",
            "This is a serious historical study visit led by a licensed museum educator. Before departure, the coordinator will introduce "
                + "the historical context and explain what to expect. At the museum we follow a guided route through the permanent exhibition, "
                + "original buildings, and memorial spaces. There will be time for quiet reflection and questions.\n\n"
                + "The subject matter is emotionally difficult. Participation is voluntary, respectful behaviour is required, and photography "
                + "must follow museum rules. Transport and the guided programme are included in the price.",
            "Meeting point: Brama Wyżynna",
            At(7, 27, 8, 30),
            At(7, 27, 16),
            price: 25m,
            minimumParticipants: 15,
            currentParticipants: 28,
            maximumParticipants: 45,
            registrationUrl: Register("stutthof-study-visit")),

        Build(
            "Open-Air Cinema: Polish Shorts",
            "A selection of subtitled short films under the evening sky.",
            "Find a place on the grass and enjoy five contemporary Polish short films with English subtitles. Blankets are available while supplies last.",
            "100cznia, Ks. Jerzego Popiełuszki 5",
            At(7, 29, 21),
            imagePath: Image("photo-1489599849927-2ee91cede3ba")),

        Build(
            "Weekend in Kashubia",
            "Two nights among lakes, forests, local food, and Kashubian traditions.",
            "Leave the city for a weekend in the Kashubian countryside. The programme combines a lake hike, a bread-making demonstration, "
                + "an introduction to the Kashubian language, a campfire, and enough unplanned time to swim or rest. We stay in a simple guesthouse "
                + "with shared rooms and shared bathrooms.\n\n"
                + "The price includes coach transport, two nights, breakfasts, Saturday dinner, workshops, and local guides. Bring a towel, "
                + "comfortable outdoor clothing, insect repellent, and a reusable water bottle. A detailed packing list will be emailed to registered participants.",
            "Departure: Gdańsk Wrzeszcz station",
            At(7, 31, 16),
            At(8, 2, 18),
            price: 299.99m,
            minimumParticipants: 24,
            currentParticipants: 34,
            maximumParticipants: 35,
            imagePath: Image("photo-1500530855697-b586d89ba3ee"),
            registrationUrl: Register("weekend-in-kashubia")),

        // August — 12 events
        Build(
            "Welcome Week Info Point",
            "Drop in with questions about transport, documents, housing, or student life.",
            "No registration. Come whenever you need us.",
            "Main Library lobby, University of Gdańsk",
            At(8, 3, 10),
            At(8, 3, 15)),

        Build(
            "Speed Friending",
            "Short conversations designed to turn a room of strangers into familiar faces.",
            "You will rotate through a series of friendly conversation rounds with prompts that go beyond the usual name-country-field-of-study introduction. "
                + "After the structured part, stay for music, snacks, and normal conversations with the people you clicked with.",
            "Olivia Star ground floor",
            At(8, 4, 18, 30),
            At(8, 4, 21),
            currentParticipants: 72,
            maximumParticipants: 120,
            registrationUrl: Register("speed-friending")),

        Build(
            "City Game",
            "Solve clues across the Old Town while competing in international teams.",
            "Your team receives a map, a first clue, and ninety minutes to uncover hidden details around central Gdańsk. "
                + "Tasks mix observation, local history, photographs, and small creative challenges. No local knowledge is needed. "
                + "The route finishes at a café where scores are counted and prizes are awarded.",
            "Golden Gate, Gdańsk",
            At(8, 6, 16),
            At(8, 6, 19),
            price: 10m,
            minimumParticipants: 12,
            currentParticipants: 53,
            maximumParticipants: 80,
            imagePath: Image("photo-1541849546-216549ae216d"),
            registrationUrl: Register("august-city-game")),

        Build(
            "Rooftop Language Exchange",
            "Practise languages while the city lights come on.",
            "Tables are marked by language and level. Move freely, help someone with your native language, and practise the one you are learning. "
                + "There is no lesson plan and mistakes are very welcome.",
            "Olivia Garden rooftop terrace",
            At(8, 8, 19),
            At(8, 8, 22),
            price: 12.50m,
            maximumParticipants: 90,
            imagePath: Image("photo-1529156069898-49953e39b3ac")),

        Build(
            "Malbork Castle Expedition",
            "Explore the world's largest brick castle with an English-speaking guide.",
            "Our train leaves Gdańsk in the morning and arrives close to the medieval fortress. The guided route covers the Grand Masters' Palace, "
                + "courtyards, defensive walls, amber collection, and everyday life in the Teutonic state. After the tour, you will have free time "
                + "for lunch and independent exploration before the return train.\n\nWear comfortable shoes: the route includes stairs and uneven stone surfaces.",
            "Meeting point: Gdańsk Główny, platform hall",
            At(8, 10, 8),
            At(8, 10, 18),
            price: 95m,
            minimumParticipants: 18,
            currentParticipants: 44,
            maximumParticipants: 46,
            imagePath: Image("photo-1533154683836-84ea7a0bc310"),
            registrationUrl: Register("malbork-castle-expedition")),

        Build(
            "Erasmus Photography Walk",
            "Find reflections, geometry, colour, and small stories in the shipyard.",
            "Bring any camera, including your phone. We will share five visual prompts, walk in small groups, and finish by comparing favourite shots over coffee.",
            "European Solidarity Centre entrance",
            At(8, 13, 17),
            At(8, 13, 19, 30),
            currentParticipants: 18,
            maximumParticipants: 30),

        Build(
            "Vistula Spit Cycling Weekend",
            "A two-day coastal ride with one night near the lagoon.",
            "Day one follows quiet roads and forest tracks from Gdańsk toward the Vistula Spit. We stop for lunch, viewpoints, and a swim before reaching "
                + "our overnight accommodation. Day two continues along the lagoon and returns by regional train. The total distance is approximately "
                + "105 kilometres, so participants should be comfortable riding 50–60 kilometres per day.\n\n"
                + "A bicycle, helmet, reflective vest, accommodation, breakfast, luggage transfer, and return train are included. The route may change with weather.",
            "Bike station, Gdańsk Śródmieście",
            At(8, 15, 7, 30),
            At(8, 16, 20),
            price: 220m,
            minimumParticipants: 10,
            currentParticipants: 13,
            maximumParticipants: 14,
            imagePath: Image("photo-1529422643029-d4585747aaf2"),
            registrationUrl: Register("vistula-spit-cycling")),

        Build(
            "Polish Folk Dance Workshop",
            "Learn the basics of polonez and two energetic regional dances.",
            "Professional instructors will guide the group from simple steps to a complete short choreography. Come in comfortable shoes; no partner is required.",
            "Dance Hall, Miszewskiego 12",
            At(8, 18, 18),
            At(8, 18, 20),
            price: 15m,
            currentParticipants: 31,
            maximumParticipants: 48,
            registrationUrl: Register("folk-dance-workshop")),

        Build(
            "Board Game Night",
            "Meet over cards, dice, cooperative puzzles, and strategy classics.",
            "A second summer edition with a different game library, including several language-independent games. Hosts will teach every table.",
            "Młody Byron, Jesionowa 18",
            At(8, 20, 19),
            At(8, 20, 23),
            price: 5m,
            currentParticipants: 22,
            maximumParticipants: 60),

        Build(
            "Motława Sunset Cruise",
            "An evening cruise past the shipyard, granaries, and harbour cranes.",
            "Board a small passenger boat for a slow two-hour route through the historic port. A guide will point out landmarks and explain how the waterfront changed "
                + "from a medieval trading centre to a modern city. Bring a warm layer even on a sunny day—the wind on the water can be cold.",
            "Rybackie Pobrzeże, gate 4",
            At(8, 22, 19),
            At(8, 22, 21),
            price: 55m,
            currentParticipants: 38,
            maximumParticipants: 40,
            imagePath: Image("photo-1500375592092-40eb2168fd21"),
            registrationUrl: Register("motlawa-sunset-cruise")),

        Build(
            "International Food Fair",
            "Cook a small dish from home or come ready to taste the world.",
            "Teams receive table space, basic serving supplies, and labels for ingredients and allergens. Cooking facilities are limited, so bring food ready to serve "
                + "or needing only simple reheating. Visitors vote for the most surprising flavour, best presentation, and strongest comfort-food energy.\n\n"
                + "Participation is free. Food teams must register; visitors can simply arrive. Please label all common allergens clearly.",
            "Faculty of Social Sciences courtyard",
            At(8, 25, 16),
            At(8, 25, 20),
            currentParticipants: 110,
            maximumParticipants: 250,
            imagePath: Image("photo-1555939594-58d7cb561ad1"),
            registrationUrl: Register("international-food-fair")),

        Build(
            "Welcome Week Opening",
            "The official start of a new international semester in Gdańsk.",
            "Meet the ESN Gdańsk team, discover the full Welcome Week programme, and find out how to join trips, cultural events, sports, and volunteering projects. "
                + "The evening begins with a short introduction and continues with music, activity stands, and plenty of time to meet other students.\n\n"
                + "Come alone if you have just arrived—most people do. Our volunteers will help everyone find a conversation and feel at home.",
            "Stary Maneż, Słowackiego 23",
            At(8, 29, 18),
            At(8, 29, 23),
            price: 20m,
            minimumParticipants: 50,
            currentParticipants: 148,
            maximumParticipants: 300,
            imagePath: Image("photo-1527529482837-4698179dc6ce"),
            registrationUrl: Register("welcome-week-opening")),

        // September — 11 events
        Build(
            "Campus Orientation Walk",
            "Find lecture halls, libraries, cafeterias, and the useful shortcuts.",
            "A practical campus walk led by current students. Ask anything.",
            "University of Gdańsk, main gate",
            At(9, 1, 11),
            At(9, 1, 12, 30),
            currentParticipants: 64,
            maximumParticipants: 100),

        Build(
            "Tricity Beach Tram Challenge",
            "Complete seaside tasks while travelling between Gdańsk, Sopot, and Gdynia.",
            "Small teams receive a day ticket and a set of challenges spread across the Tricity. Strategy matters: tasks have different scores, opening hours, "
                + "and travel times. You may need to recreate a famous photograph, find a hidden viewpoint, speak with a local, or solve a transport puzzle. "
                + "The finish line is announced halfway through the game.\n\n"
                + "Wear comfortable shoes and bring a charged phone. Public transport is included; food is not.",
            "Start: Gdańsk University SKM station",
            At(9, 3, 10),
            At(9, 3, 17),
            price: 18m,
            minimumParticipants: 20,
            currentParticipants: 76,
            maximumParticipants: 96,
            registrationUrl: Register("tricity-challenge")),

        Build(
            "Sopot Pub Quiz",
            "Five rounds of music, geography, strange facts, and Erasmus trivia.",
            "Teams of up to six compete for small prizes and enormous prestige. Come with a team or let us match you with one at the door.",
            "3 Siostry, Powstańców Warszawy 6",
            At(9, 5, 19, 30),
            At(9, 5, 22),
            price: 8m,
            currentParticipants: 67,
            maximumParticipants: 90),

        Build(
            "Gdynia Aquarium Visit",
            "An afternoon with Baltic ecosystems, coral reefs, and unusual marine life.",
            "We travel together by SKM and follow an English-language educational route through the aquarium. Your ticket includes entry and the guided session; "
                + "return transport is separate so you can stay in Gdynia after the event.",
            "Meeting point: Gdynia Główna ticket hall",
            At(9, 8, 13),
            At(9, 8, 17),
            price: 32m,
            currentParticipants: 29,
            maximumParticipants: 35,
            imagePath: Image("photo-1544550285-f813152fb2fd"),
            registrationUrl: Register("gdynia-aquarium")),

        Build(
            "International CV Workshop",
            "Turn your experience into a clear CV for internships across Europe.",
            "A recruiter will explain common CV differences between European job markets, show examples, and run a short peer-review exercise. "
                + "Bring a laptop and a current CV if you have one. The session is useful even if you are not applying yet.",
            "Olivia Business Centre, Olivia Four",
            At(9, 10, 17, 30),
            At(9, 10, 19),
            currentParticipants: 21,
            maximumParticipants: 40,
            registrationUrl: Register("international-cv-workshop")),

        Build(
            "International Football Tournament",
            "Mixed seven-a-side teams, group matches, playoffs, and fair-play prizes.",
            "Register individually or with friends. Teams will be balanced before the tournament, and every team is guaranteed at least three matches. "
                + "Artificial-grass shoes are recommended; metal studs are not allowed. Water and basic first aid will be available.",
            "MOSiR pitches, Traugutta 29",
            At(9, 13, 9),
            At(9, 13, 16),
            price: 20m,
            minimumParticipants: 35,
            currentParticipants: 81,
            maximumParticipants: 84,
            imagePath: Image("photo-1579952363873-27f3bade9f55"),
            registrationUrl: Register("football-tournament")),

        Build(
            "Polish Movie Night",
            "A modern Polish comedy with English subtitles and a short discussion.",
            "Film title announced one week before the screening. Popcorn included.",
            "Academic Culture Centre, Wita Stwosza 58",
            At(9, 16, 19),
            At(9, 16, 21, 15),
            price: 6m,
            maximumParticipants: 70),

        Build(
            "Animal Shelter Volunteer Day",
            "Help with walking dogs, organising donations, and simple maintenance.",
            "The shelter team will divide us into small groups based on current needs. Tasks may include supervised dog walks, sorting food and blankets, cleaning shared "
                + "areas, assembling enrichment toys, and taking photographs for adoption profiles. You do not need animal-care experience, but you must follow staff instructions.\n\n"
                + "Wear old clothes and closed shoes. Transport from central Gdańsk, gloves, lunch, and insurance are provided. Places are limited because every group requires supervision.",
            "Meeting point: Hucisko bus stop",
            At(9, 19, 8),
            At(9, 19, 15),
            currentParticipants: 18,
            maximumParticipants: 20,
            registrationUrl: Register("shelter-volunteer-day")),

        Build(
            "Autumn Hike in the Tricity Landscape Park",
            "Forest trails, moraine hills, and a picnic viewpoint above the city.",
            "A moderate 14-kilometre hike with several steep but short climbs. We move at a social pace and stop for lunch at a viewpoint. "
                + "Hiking boots are helpful after rain. Bring food, at least one litre of water, and a waterproof layer.",
            "Start: Gdańsk Oliwa SKM station",
            At(9, 22, 9, 30),
            At(9, 22, 15),
            currentParticipants: 33,
            maximumParticipants: 45,
            imagePath: Image("photo-1551632811-561732d1e306"),
            registrationUrl: Register("autumn-hike")),

        Build(
            "Board Game Night",
            "The recurring monthly night for new games and familiar faces.",
            "September's tables focus on social deduction, cooperative games, and titles that can be explained in under ten minutes.",
            "Młody Byron, Jesionowa 18",
            At(9, 25, 19),
            At(9, 25, 23),
            price: 5m,
            currentParticipants: 35,
            maximumParticipants: 60),

        Build(
            "Baltic Bonfire & Stories",
            "Close the month by the sea with music, warm tea, and shared stories.",
            "We provide firewood, reusable cups, hot tea, marshmallows, and a guitar that may or may not stay in tune. Bring a blanket, warm layers, "
                + "and one short story from your home country—funny, strange, historical, or completely ordinary. The exact beach entrance may change depending on wind conditions.\n\n"
                + "This is a leave-no-trace event. Everything brought to the beach must leave with us, and the fire will only be lit if local conditions allow it.",
            "Stogi Beach, final entrance shared by email",
            At(9, 29, 18),
            At(9, 29, 22),
            currentParticipants: 58,
            maximumParticipants: 80,
            imagePath: Image("photo-1475483768296-6163e08872a1"),
            registrationUrl: Register("baltic-bonfire"))
    ];

    private static Event Build(
        string title,
        string shortDescription,
        string description,
        string location,
        DateTimeOffset startsAt,
        DateTimeOffset? endsAt = null,
        decimal price = 0m,
        int? minimumParticipants = null,
        int? currentParticipants = null,
        int? maximumParticipants = null,
        string? imagePath = null,
        string? registrationUrl = null) =>
        new()
        {
            Title = title,
            ShortDescription = shortDescription,
            Description = description,
            Location = location,
            StartsAt = startsAt,
            EndsAt = endsAt,
            ImagePath = imagePath,
            RegistrationUrl = registrationUrl,
            Status = EventStatus.Published,
            PublishedAt = startsAt.AddMonths(-1),
            MinimumParticipants = minimumParticipants,
            CurrentParticipants = currentParticipants,
            MaximumParticipants = maximumParticipants,
            Price = price,
        };

    private static DateTimeOffset At(int month, int day, int hour, int minute = 0) =>
        new DateTimeOffset(2026, month, day, hour, minute, 0, TimeSpan.FromHours(2))
            .ToUniversalTime();

    private static string Image(string photoId) =>
        $"https://images.unsplash.com/{photoId}?auto=format&fit=crop&w=1200&q=80";

    private static string Register(string eventName) =>
        $"https://example.com/register/{eventName}";
}
