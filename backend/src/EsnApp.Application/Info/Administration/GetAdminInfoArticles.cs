using EsnApp.Application.Common;
using EsnApp.Domain.Info;
using MediatR;

namespace EsnApp.Application.Info;

public record GetAdminInfoArticlesQuery(InfoArticleStatus? Status, string? Category)
    : IRequest<Result<IReadOnlyList<AdminInfoArticleDto>>>;

public class GetAdminInfoArticlesQueryHandler(IInfoArticleRepository repository)
    : IRequestHandler<GetAdminInfoArticlesQuery, Result<IReadOnlyList<AdminInfoArticleDto>>>
{
    public async Task<Result<IReadOnlyList<AdminInfoArticleDto>>> Handle(
        GetAdminInfoArticlesQuery request,
        CancellationToken cancellationToken)
    {
        var articles = await repository.GetAdminListAsync(
            request.Status, request.Category, cancellationToken);
        return Result.Success<IReadOnlyList<AdminInfoArticleDto>>(
            articles.Select(AdminInfoArticleDto.FromEntity).ToList());
    }
}

public record GetAdminInfoArticleByIdQuery(Guid Id) : IRequest<Result<AdminInfoArticleDto>>;

public class GetAdminInfoArticleByIdQueryHandler(IInfoArticleRepository repository)
    : IRequestHandler<GetAdminInfoArticleByIdQuery, Result<AdminInfoArticleDto>>
{
    public async Task<Result<AdminInfoArticleDto>> Handle(
        GetAdminInfoArticleByIdQuery request,
        CancellationToken cancellationToken)
    {
        var article = await repository.GetAdminByIdAsync(request.Id, cancellationToken);
        return article is null
            ? Result.Failure<AdminInfoArticleDto>($"Info article '{request.Id}' was not found.")
            : Result.Success(AdminInfoArticleDto.FromEntity(article));
    }
}
