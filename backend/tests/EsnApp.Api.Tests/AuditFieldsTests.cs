using EsnApp.Application.Identity;
using EsnApp.Domain.News;
using EsnApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace EsnApp.Api.Tests;

/// <summary>Exercises AppDbContext.ApplyAuditFields on the change tracker; no DB connection is opened.</summary>
public class AuditFieldsTests
{
    private sealed class CurrentUser(string? userId, string? displayName) : ICurrentUser
    {
        public string? UserId => userId;

        public string? DisplayName => displayName;
    }

    private static AppDbContext CreateContext(ICurrentUser? user) => new(
        new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=unused;Username=unused;Password=unused")
            .Options,
        user);

    private static NewsItem ExistingItem(string? updatedById = "creator") => new()
    {
        Id = Guid.NewGuid(),
        Title = "Title",
        Description = "Description",
        UpdatedById = updatedById,
        UpdatedByName = updatedById,
    };

    [Fact]
    public void Added_CopiesCreatorIntoUpdatedBy()
    {
        using var context = CreateContext(new CurrentUser("editor", "Ewa N."));
        var item = new NewsItem { Title = "Title", Description = "Description", CreatedById = "creator", CreatedByName = "Jan K." };
        context.Add(item);

        context.ApplyAuditFields();

        Assert.Equal("creator", item.UpdatedById);
        Assert.Equal("Jan K.", item.UpdatedByName);
    }

    [Fact]
    public void Edit_StampsCurrentUserAndUpdatedAt()
    {
        using var context = CreateContext(new CurrentUser("editor", "Ewa N."));
        var item = ExistingItem();
        context.Update(item);

        context.ApplyAuditFields();

        Assert.Equal("editor", item.UpdatedById);
        Assert.Equal("Ewa N.", item.UpdatedByName);
        Assert.NotNull(item.UpdatedAt);
    }

    [Fact]
    public void Edit_WithoutUser_KeepsLastEditor()
    {
        using var context = CreateContext(null);
        var item = ExistingItem();
        context.Update(item);

        context.ApplyAuditFields();

        Assert.Equal("creator", item.UpdatedById);
    }

    [Fact]
    public void ReorderOnly_IsNotStampedAsEdit()
    {
        using var context = CreateContext(new CurrentUser("editor", "Ewa N."));
        var item = ExistingItem();
        context.Attach(item).Property(entity => entity.DisplayOrder).IsModified = true;

        context.ApplyAuditFields();

        Assert.Equal("creator", item.UpdatedById);
        Assert.Null(item.UpdatedAt);
    }
}
