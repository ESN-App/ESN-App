using EsnApp.Domain.Info;

namespace EsnApp.Application.Info;

public interface IInfoArticleRepository
{
    Task<IReadOnlyList<InfoArticle>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<InfoArticle?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<InfoArticle> AddAsync(InfoArticle entity, CancellationToken cancellationToken = default);
}
