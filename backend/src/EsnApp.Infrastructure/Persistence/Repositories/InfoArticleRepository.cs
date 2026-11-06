using EsnApp.Application.Info;
using EsnApp.Domain.Info;
using Microsoft.EntityFrameworkCore;

namespace EsnApp.Infrastructure.Persistence.Repositories;

public class InfoArticleRepository(AppDbContext context)
    : RepositoryBase<InfoArticle>(context), IInfoArticleRepository
{
    public async Task<IReadOnlyList<InfoArticle>> GetAllAsync(
        string? category,
        CancellationToken cancellationToken = default)
    {
        var query = Context.InfoArticles
            .AsNoTracking()
            .Where(article => article.Status == InfoArticleStatus.Published);

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(article => article.Category == category);

        return await query
            .OrderBy(article => article.DisplayOrder)
            .ThenByDescending(article => article.CreatedAt)
            .ThenBy(article => article.Title)
            .ToListAsync(cancellationToken);
    }

    public override async Task<InfoArticle?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        await Context.InfoArticles.AsNoTracking().FirstOrDefaultAsync(
            article => article.Id == id && article.Status == InfoArticleStatus.Published,
            cancellationToken);

    public async Task<InfoArticle?> GetBySlugAsync(
        string slug,
        CancellationToken cancellationToken = default) =>
        await Context.InfoArticles.AsNoTracking().FirstOrDefaultAsync(
            article => article.Slug == slug && article.Status == InfoArticleStatus.Published,
            cancellationToken);

    public async Task<IReadOnlyList<InfoArticle>> GetAdminListAsync(
        InfoArticleStatus? status,
        string? category,
        CancellationToken cancellationToken = default)
    {
        var query = Context.InfoArticles.AsNoTracking();
        if (status.HasValue)
            query = query.Where(article => article.Status == status);
        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(article => article.Category == category);

        return await query.OrderBy(article => article.Status)
            .ThenBy(article => article.DisplayOrder)
            .ThenByDescending(article => article.CreatedAt)
            .ThenBy(article => article.Title)
            .ToListAsync(cancellationToken);
    }

    public async Task<InfoArticle?> GetAdminByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        await Context.InfoArticles.FirstOrDefaultAsync(
            article => article.Id == id, cancellationToken);

    public Task<bool> SlugExistsAsync(
        string slug,
        Guid? excludingId = null,
        CancellationToken cancellationToken = default) =>
        Context.InfoArticles.AnyAsync(
            article => article.Slug == slug
                && (!excludingId.HasValue || article.Id != excludingId.Value),
            cancellationToken);

    public async Task UpdateRangeAsync(
        IReadOnlyCollection<InfoArticle> entities,
        CancellationToken cancellationToken = default)
    {
        // Only DisplayOrder is written, so a reorder is not stamped as an edit (see AppDbContext).
        foreach (var entity in entities)
        {
            Context.Attach(entity).Property(item => item.DisplayOrder).IsModified = true;
        }

        await Context.SaveChangesAsync(cancellationToken);
    }
}
