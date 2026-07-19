using EsnApp.Application.Info;
using EsnApp.Domain.Info;

namespace EsnApp.Infrastructure.Persistence.Repositories;

public class InfoArticleRepository(AppDbContext context)
    : RepositoryBase<InfoArticle>(context), IInfoArticleRepository
{
}
