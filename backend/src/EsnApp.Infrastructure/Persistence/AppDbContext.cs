using EsnApp.Domain.Common;
using EsnApp.Domain.Discounts;
using EsnApp.Domain.Events;
using EsnApp.Domain.Info;
using EsnApp.Domain.News;
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

    public DbSet<NewsItem> NewsItems => Set<NewsItem>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.ApplyConfiguration(new EventConfiguration());
        builder.ApplyConfiguration(new PartnerConfiguration());
        builder.ApplyConfiguration(new InfoArticleConfiguration());
        builder.ApplyConfiguration(new NewsItemConfiguration());

        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(user => user.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(user => user.FirstName).HasMaxLength(50);
            entity.Property(user => user.LastName).HasMaxLength(50);
        });

        // No FK to AspNetUsers on purpose: the creator snapshot must survive admin deletion.
        foreach (var entityType in builder.Model.GetEntityTypes()
                     .Where(type => typeof(CreatorTrackedEntity).IsAssignableFrom(type.ClrType)))
        {
            builder.Entity(entityType.ClrType).Property(nameof(CreatorTrackedEntity.CreatedById)).HasMaxLength(450);
            builder.Entity(entityType.ClrType).Property(nameof(CreatorTrackedEntity.CreatedByName)).HasMaxLength(120);
        }

        builder.Entity<Discount>(entity =>
        {
            entity.Property(d => d.Title).HasMaxLength(200);
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
