using EsnApp.Domain.Discounts;
using EsnApp.Domain.Events;
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
        if (!await context.Events.AnyAsync())
        {
            var now = DateTimeOffset.UtcNow;

            context.Events.AddRange(
                new Event
                {
                    Title = "Welcome Week Opening",
                    ShortDescription = "Start the semester with ESN Gdańsk.",
                    Description = "Welcome Week Opening is the official start of your Erasmus adventure in Gdańsk. "
                        + "Join us for an evening where you can meet international students, get to know the ESN Gdańsk team, "
                        + "and learn what we have planned for the upcoming semester. We will introduce our trips, cultural events, "
                        + "parties, volunteering opportunities, and practical activities designed to help you settle into the city. "
                        + "Come alone or bring your new flatmates—this is the perfect opportunity to make your first friends, ask questions, "
                        + "and celebrate the beginning of an unforgettable exchange.",
                    Location = "Gdańsk, Długi Targ",
                    StartsAt = now.AddDays(7),
                    EndsAt = now.AddDays(7).AddHours(4),
                    ImagePath = "/images/events/welcome-week-opening.jpg",
                    RegistrationUrl = "https://example.com/register/welcome-week-opening",
                    Status = EventStatus.Published,
                    PublishedAt = now,
                    MinimumParticipants = 20,
                    MaximumParticipants = 150,
                    CurrentParticipants = 48,
                    Price = 20.00m,
                },
                new Event
                {
                    Title = "City Game",
                    ShortDescription = "Discover Gdańsk while competing in teams.",
                    Description = "Discover Gdańsk from a completely new perspective during our international City Game. "
                        + "You will be placed in a team with other Erasmus students and sent through the historic streets of the Old Town "
                        + "to solve puzzles, complete creative challenges, and uncover stories hidden behind the city's most famous landmarks. "
                        + "No detailed knowledge of Gdańsk is required—curiosity, comfortable shoes, and a charged phone are all you need. "
                        + "The game ends with a shared meeting where we announce the winners, hand out prizes, and exchange photos and stories from the route.",
                    Location = "Gdańsk, Golden Gate",
                    StartsAt = now.AddDays(10),
                    EndsAt = now.AddDays(10).AddHours(3),
                    ImagePath = "/images/events/city-game.jpg",
                    RegistrationUrl = "https://example.com/register/city-game",
                    Status = EventStatus.Published,
                    PublishedAt = now,
                    MinimumParticipants = 12,
                    MaximumParticipants = 60,
                    CurrentParticipants = 27,
                    Price = 10.00m,
                });
        }

        if (!await context.Partners.AnyAsync())
        {
            var partner = new Partner
            {
                Name = "Example Pizzeria",
                Description = "Sample partner seeded for development.",
                WebsiteUrl = "https://example.com",
            };

            context.Partners.Add(partner);
            context.Discounts.Add(new Discount
            {
                Title = "10% off with ESNcard",
                Description = "Sample discount seeded for development.",
                Partner = partner,
            });
        }

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
}
