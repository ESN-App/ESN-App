using EsnApp.Application.Identity;
using EsnApp.Domain.Common;
using EsnApp.Domain.Discounts;
using EsnApp.Domain.Events;
using EsnApp.Domain.Features;
using EsnApp.Domain.Info;
using EsnApp.Domain.News;
using EsnApp.Domain.Settings;
using EsnApp.Infrastructure.Identity;
using EsnApp.Infrastructure.Persistence.Configurations;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace EsnApp.Infrastructure.Persistence;

// currentUser is optional so the design-time factory and the seeder (no request) still work.
public class AppDbContext(DbContextOptions<AppDbContext> options, ICurrentUser? currentUser = null)
    : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Event> Events => Set<Event>();

    public DbSet<Discount> Discounts => Set<Discount>();

    public DbSet<Partner> Partners => Set<Partner>();

    public DbSet<InfoArticle> InfoArticles => Set<InfoArticle>();

    public DbSet<NewsItem> NewsItems => Set<NewsItem>();

    public DbSet<FeatureFlag> FeatureFlags => Set<FeatureFlag>();

    public DbSet<SiteSetting> SiteSettings => Set<SiteSetting>();

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
            builder.Entity(entityType.ClrType).Property(nameof(CreatorTrackedEntity.UpdatedById)).HasMaxLength(450);
            builder.Entity(entityType.ClrType).Property(nameof(CreatorTrackedEntity.UpdatedByName)).HasMaxLength(120);
        }

        builder.Entity<FeatureFlag>(entity =>
        {
            entity.HasKey(flag => flag.Key);
            entity.Property(flag => flag.Key).HasMaxLength(100);
        });

        builder.Entity<SiteSetting>(entity =>
        {
            entity.HasKey(setting => setting.Key);
            entity.Property(setting => setting.Key).HasMaxLength(100);
            entity.Property(setting => setting.Value).HasMaxLength(500);
        });

        builder.Entity<Discount>(entity =>
        {
            entity.Property(d => d.Title).HasMaxLength(200);
        });

    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditFields();
        return base.SaveChangesAsync(cancellationToken);
    }

    /// <summary>Sets Id/CreatedAt on new rows and UpdatedAt/UpdatedBy on edited ones.</summary>
    public void ApplyAuditFields()
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
                    if (entry.Entity is CreatorTrackedEntity created)
                    {
                        created.UpdatedById = created.CreatedById;
                        created.UpdatedByName = created.CreatedByName;
                    }
                    break;

                // A reorder only touches DisplayOrder; that is not an edit of the item itself.
                case EntityState.Modified when entry.Properties.Any(
                    property => property.IsModified && property.Metadata.Name != "DisplayOrder"):
                    entry.Entity.UpdatedAt = now;
                    // No user (seeder, background work) keeps the last real editor.
                    if (entry.Entity is CreatorTrackedEntity edited && currentUser?.UserId is not null)
                    {
                        edited.UpdatedById = currentUser.UserId;
                        edited.UpdatedByName = currentUser.DisplayName;
                    }
                    break;
            }
        }
    }
}
