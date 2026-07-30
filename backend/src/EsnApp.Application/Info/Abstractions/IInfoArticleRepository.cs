using EsnApp.Domain.Info;

namespace EsnApp.Application.Info;

public interface IInfoArticleRepository
{
    Task<IReadOnlyList<InfoArticle>> GetAllAsync(
        string? category,
        CancellationToken cancellationToken = default);

    Task<InfoArticle?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<InfoArticle?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<InfoArticle>> GetAdminListAsync(
        InfoArticleStatus? status,
        string? category,
        CancellationToken cancellationToken = default);

    Task<InfoArticle?> GetAdminByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> SlugExistsAsync(
        string slug,
        Guid? excludingId = null,
        CancellationToken cancellationToken = default);

    Task<InfoArticle> AddAsync(InfoArticle entity, CancellationToken cancellationToken = default);

    Task<InfoArticle> UpdateAsync(InfoArticle entity, CancellationToken cancellationToken = default);

    Task UpdateRangeAsync(
        IReadOnlyCollection<InfoArticle> entities,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
