using EsnApp.Application.Common;
using MediatR;

namespace EsnApp.Application.Info;

public record GetInfoArticlesListQuery(string? Category = null)
    : IRequest<Result<IReadOnlyList<InfoArticleDto>>>;

public class GetInfoArticlesListQueryHandler(IInfoArticleRepository repository)
    : IRequestHandler<GetInfoArticlesListQuery, Result<IReadOnlyList<InfoArticleDto>>>
{
    public async Task<Result<IReadOnlyList<InfoArticleDto>>> Handle(
        GetInfoArticlesListQuery request,
        CancellationToken cancellationToken)
    {
        var articles = await repository.GetAllAsync(request.Category, cancellationToken);

        return Result.Success<IReadOnlyList<InfoArticleDto>>(
            articles.Select(InfoArticleDto.FromEntity).ToList());
    }
}
