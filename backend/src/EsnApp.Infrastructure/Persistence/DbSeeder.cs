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
            context.InfoArticles.Add(new InfoArticle
            {
                Title = "About ESN Gdańsk",
                Content = "Placeholder article seeded for development.",
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
