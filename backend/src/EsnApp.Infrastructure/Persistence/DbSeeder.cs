using EsnApp.Domain.Discounts;
using EsnApp.Domain.Info;
using EsnApp.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace EsnApp.Infrastructure.Persistence;

/// <summary>
/// Applies pending migrations and seeds development data (admin role/user, sample rows).
/// Runs on startup only when Database:ApplyMigrationsOnStartup is true.
/// </summary>
public static class DbSeeder
{
    public const string AdminRole = "Admin";

    private static readonly HashSet<string> LegacyEventTitles =
    [
        "Welcome Week Opening",
        "City Game",
    ];

    private static readonly string[] LegacyPartnerNames =
    [
        "Baltic Bites",
        "Neptune Coffee",
        "Amber Fitness",
        "Wave Language School",
        "Motława Kayaks",
        "North Hostel",
        "Green Bowl",
        "Vistula Bikes",
        "Pixel Cinema",
        "Pierogi Corner",
        "SeaSide Surf School",
        "Book Nook",
        "Tricity Escape",
        "Clean Cut Studio",
        "Gdańsk Print Lab",
    ];

    public static async Task SeedAsync(IServiceProvider services)
    {
        var context = services.GetRequiredService<AppDbContext>();
        await context.Database.MigrateAsync();

        await SeedIdentityAsync(services);
        await SeedSampleDataAsync(context);
    }

    private static async Task SeedIdentityAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

        if (!await roleManager.RoleExistsAsync(AdminRole))
        {
            await roleManager.CreateAsync(new IdentityRole(AdminRole));
        }

        var configuration = services.GetRequiredService<IConfiguration>();
        var adminEmail = configuration["Seed:AdminEmail"];
        var adminPassword = configuration["Seed:AdminPassword"];

        if (string.IsNullOrWhiteSpace(adminEmail) || string.IsNullOrWhiteSpace(adminPassword))
        {
            return;
        }

        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

        if (await userManager.FindByEmailAsync(adminEmail) is null)
        {
            var admin = new ApplicationUser { UserName = adminEmail, Email = adminEmail };
            var result = await userManager.CreateAsync(admin, adminPassword);

            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, AdminRole);
            }
        }
    }

    private static async Task SeedSampleDataAsync(AppDbContext context)
    {
        await SeedEventsAsync(context);
        await SeedPartnersAsync(context);

        if (!await context.InfoArticles.AnyAsync())
        {
            context.InfoArticles.AddRange(
                new InfoArticle
                {
                    Title = "What is ESN?",
                    Slug = "what-is-esn",
                    Content = "Erasmus Student Network is one of the largest student associations in Europe. ESN Gdańsk helps international students settle in, meet new people and discover the city through events, trips and everyday support.\n\nOur volunteers organise activities throughout the semester and are always happy to share local tips. Whether you are looking for friends, practical advice or a new adventure, ESN is here to make your Erasmus experience feel more like home.\n\nFollow our channels to learn about upcoming events and ways to get involved.",
                    Category = "ESN",
                    ImageUrl = new Uri("https://images.unsplash.com/photo-1529156069898-49953e39b3ac"),
                    ExternalLinks = ["https://esn.org"],
                    DisplayOrder = 0,
                    Status = InfoArticleStatus.Published,
                },
                new InfoArticle
                {
                    Title = "Contact",
                    Slug = "contact",
                    Content = "Do you need help or have a question? Contact our team through our social media channels. We will point you to the right person and reply as soon as possible.\n\nYou can ask about ESN events, the Buddy System, the ESNcard or everyday life in Gdańsk. If your question concerns university administration, we will help you find the right international office contact.\n\nPlease include as much context as possible so we can support you quickly.",
                    Category = "ESN",
                    ImageUrl = new Uri("https://images.unsplash.com/photo-1423666639041-f56000c27a9a"),
                    ExternalLinks = ["https://www.instagram.com/esngdansk"],
                    DisplayOrder = 1,
                    Status = InfoArticleStatus.Published,
                },
                new InfoArticle
                {
                    Title = "Student information",
                    Slug = "student-information",
                    Content = "Remember to complete your university registration, obtain your student ID and check your course schedule. Keep copies of important documents such as your learning agreement, insurance details and accommodation contract.\n\nYour university international office can help with formal matters related to studies, accommodation and residence. They can also explain deadlines, course changes and the documents needed before you leave Poland.\n\nFor day-to-day questions, do not hesitate to ask other students or your ESN buddy.",
                    Category = "Student life",
                    ImageUrl = new Uri("https://images.unsplash.com/photo-1523240795612-9a054b0db644"),
                    DisplayOrder = 2,
                    Status = InfoArticleStatus.Published,
                },
                new InfoArticle
                {
                    Title = "WhatsApp group",
                    Slug = "whatsapp-group",
                    Content = "Join the official WhatsApp group to receive announcements, ask questions and stay in touch with other international students. It is a useful place to find people for coffee, study sessions and spontaneous city plans.\n\nPlease follow the group rules, be respectful and keep conversations relevant to the community. Avoid posting spam, commercial offers or anyone else's personal information.\n\nNever share the invitation link publicly. Ask an ESN volunteer if you need a new invitation.",
                    Category = "Community",
                    ImageUrl = new Uri("https://images.unsplash.com/photo-1521737711867-e3b97375f902"),
                    ExternalLinks = ["https://chat.whatsapp.com/example-invite"],
                    DisplayOrder = 3,
                    Status = InfoArticleStatus.Published,
                },
                new InfoArticle
                {
                    Title = "ESNcard",
                    Slug = "esncard",
                    Content = "The ESNcard is the membership card of the Erasmus Student Network. It gives access to ESN events and discounts offered by local and international partners.\n\nAsk the ESN Gdańsk team where and when you can collect yours. Bring the required payment and a passport-style photo if the current collection instructions ask for one.\n\nKeep your card with you when attending ESN events or using a partner discount, as you may be asked to show it.",
                    Category = "Student life",
                    ImageUrl = new Uri("https://images.unsplash.com/photo-1556742049-0cfed4f6a45d"),
                    ExternalLinks = ["https://esncard.org"],
                    DisplayOrder = 4,
                    Status = InfoArticleStatus.Published,
                },
                new InfoArticle
                {
                    Title = "Buddy System",
                    Slug = "buddy-system",
                    Content = "The Buddy System connects international students with local volunteers. Your buddy can answer practical questions, show you around Gdańsk and help you feel at home during your first weeks.\n\nYou can ask for help with finding your way around campus, buying a public transport ticket, setting up a Polish phone number or discovering places locals enjoy. Your buddy is not an official university representative, but they can share their own experience.\n\nBe open, communicate your expectations and enjoy getting to know the city together.",
                    Category = "Community",
                    ImageUrl = new Uri("https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc"),
                    ExternalLinks = ["https://papaya.iter-idea.com"],
                    DisplayOrder = 5,
                    Status = InfoArticleStatus.Published,
                },
                new InfoArticle
                {
                    Title = "ESN Gdańsk board",
                    Slug = "esn-gdansk-board",
                    Content = "This section will introduce the current ESN Gdańsk board and explain who is responsible for each area. Board members coordinate events, partnerships, communication and support for international students.\n\nThe final names, roles and contact details will be added by the ESN team. This makes it easier to know who to contact with a specific question or idea.\n\nIf you would like to volunteer, the board can also explain how to join the local section.",
                    Category = "ESN",
                    ImageUrl = new Uri("https://images.unsplash.com/photo-1517245386807-bb43f82c33c4"),
                    DisplayOrder = 0,
                    Status = InfoArticleStatus.Draft,
                });
        }

        await context.SaveChangesAsync();
    }

    private static async Task SeedEventsAsync(AppDbContext context)
    {
        var existingEvents = await context.Events
            .AsNoTracking()
            .Select(eventItem => new { eventItem.Title, eventItem.StartsAt })
            .ToListAsync();

        var missingEvents = EventSeedData.Create()
            .Where(seedEvent => existingEvents.All(existing =>
                existing.Title != seedEvent.Title
                || (existing.StartsAt != seedEvent.StartsAt
                    && !LegacyEventTitles.Contains(seedEvent.Title))))
            .ToList();

        context.Events.AddRange(missingEvents);
    }

    private static async Task SeedPartnersAsync(AppDbContext context)
    {
        var existingPartners = await context.Partners
            .Include(partner => partner.Discounts)
            .ToDictionaryAsync(partner => partner.Name, StringComparer.OrdinalIgnoreCase);

        foreach (var seedPartner in PartnerSeedData.Create())
        {
            if (!existingPartners.TryGetValue(seedPartner.Name, out var existingPartner))
            {
                var legacyName = LegacyPartnerNames[seedPartner.DisplayOrder];

                if (!existingPartners.TryGetValue(legacyName, out existingPartner))
                {
                    context.Partners.Add(seedPartner);
                    continue;
                }
            }

            ApplySeedPartner(context, existingPartner, seedPartner);
        }
    }

    private static void ApplySeedPartner(AppDbContext context, Partner target, Partner source)
    {
        target.Name = source.Name;
        target.LogoPath = source.LogoPath;
        target.ShortDescription = source.ShortDescription;
        target.Description = source.Description;
        target.Address = source.Address;
        target.WebsiteUrl = source.WebsiteUrl;
        target.GoogleMapsUrl = source.GoogleMapsUrl;
        target.Latitude = source.Latitude;
        target.Longitude = source.Longitude;
        target.Status = source.Status;
        target.DisplayOrder = source.DisplayOrder;

        var existingDiscounts = target.Discounts.ToList();
        var seededDiscounts = source.Discounts.ToList();

        for (var index = 0; index < seededDiscounts.Count; index++)
        {
            if (index < existingDiscounts.Count)
            {
                existingDiscounts[index].Title = seededDiscounts[index].Title;
                existingDiscounts[index].Description = seededDiscounts[index].Description;
                continue;
            }

            target.Discounts.Add(new Discount
            {
                Title = seededDiscounts[index].Title,
                Description = seededDiscounts[index].Description,
                Partner = target,
            });
        }

        foreach (var obsoleteDiscount in existingDiscounts.Skip(seededDiscounts.Count))
        {
            context.Discounts.Remove(obsoleteDiscount);
        }
    }
}
