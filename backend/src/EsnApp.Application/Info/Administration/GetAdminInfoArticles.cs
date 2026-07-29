using EsnApp.Application.Common;
using EsnApp.Domain.Info;
using MediatR;

namespace EsnApp.Application.Info;

public record GetAdminInfoArticlesQuery(InfoArticleStatus? Status, string? Category)
    : IRequest<Result<IReadOnlyList<InfoArticleDto>>>;

public class GetAdminInfoArticlesQueryHandler(IInfoArticleRepository repository)
    : IRequestHandler<GetAdminInfoArticlesQuery, Result<IReadOnlyList<InfoArticleDto>>>
{
    public async Task<Result<IReadOnlyList<InfoArticleDto>>> Handle(
        GetAdminInfoArticlesQuery request,
        CancellationToken cancellationToken)
    {
        var articles = await repository.GetAdminListAsync(
            request.Status, request.Category, cancellationToken);
        return Result.Success<IReadOnlyList<InfoArticleDto>>(
            articles.Select(InfoArticleDto.FromEntity).ToList());
    }
}

public record GetAdminInfoArticleByIdQuery(Guid Id) : IRequest<Result<InfoArticleDto>>;

public class GetAdminInfoArticleByIdQueryHandler(IInfoArticleRepository repository)
    : IRequestHandler<GetAdminInfoArticleByIdQuery, Result<InfoArticleDto>>
{
    public async Task<Result<InfoArticleDto>> Handle(
        GetAdminInfoArticleByIdQuery request,
        CancellationToken cancellationToken)
    {
        var article = await repository.GetAdminByIdAsync(request.Id, cancellationToken);
        return article is null
            ? Result.Failure<InfoArticleDto>($"Info article '{request.Id}' was not found.")
            : Result.Success(InfoArticleDto.FromEntity(article));
    }
}
