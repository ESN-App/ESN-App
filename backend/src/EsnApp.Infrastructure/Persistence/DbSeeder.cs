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
            context.Events.AddRange(
                new Event
                {
                    Title = "Welcome Week Opening",
                    Description = "Kick-off event for the new Erasmus semester.",
                    Location = "Gdańsk, Długi Targ",
                    StartsAt = DateTimeOffset.UtcNow.AddDays(7),
                },
                new Event
                {
                    Title = "City Game",
                    Description = "Explore Gdańsk old town in teams.",
                    Location = "Gdańsk, Golden Gate",
                    StartsAt = DateTimeOffset.UtcNow.AddDays(10),
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
