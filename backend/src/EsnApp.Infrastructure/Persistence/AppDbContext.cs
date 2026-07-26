using EsnApp.Domain.Common;
using EsnApp.Domain.Discounts;
using EsnApp.Domain.Events;
using EsnApp.Domain.Info;
using EsnApp.Infrastructure.Identity;
using EsnApp.Infrastructure.Persistence.Configurations;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace EsnApp.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Event> Events => Set<Event>();

    public DbSet<Discount> Discounts => Set<Discount>();

    public DbSet<Partner> Partners => Set<Partner>();

    public DbSet<InfoArticle> InfoArticles => Set<InfoArticle>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.ApplyConfiguration(new EventConfiguration());

        builder.Entity<Partner>(entity =>
        {
            entity.Property(p => p.Name).HasMaxLength(200);
            entity.Property(p => p.WebsiteUrl).HasMaxLength(500);
        });

        builder.Entity<Discount>(entity =>
        {
            entity.Property(d => d.Title).HasMaxLength(200);
            entity.HasOne(d => d.Partner)
                .WithMany()
                .HasForeignKey(d => d.PartnerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<InfoArticle>(entity =>
        {
            entity.Property(a => a.Title).HasMaxLength(200);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    if (entry.Entity.Id == Guid.Empty)
                    {
                        entry.Entity.Id = Guid.NewGuid();
                    }

                    entry.Entity.CreatedAt = now;
                    break;

                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
