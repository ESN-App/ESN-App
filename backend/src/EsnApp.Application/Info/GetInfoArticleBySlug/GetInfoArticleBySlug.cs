using EsnApp.Application.Common;
using MediatR;

namespace EsnApp.Application.Info;

public record GetInfoArticleBySlugQuery(string Slug) : IRequest<Result<InfoArticleDto>>;

public class GetInfoArticleBySlugQueryHandler(IInfoArticleRepository repository)
    : IRequestHandler<GetInfoArticleBySlugQuery, Result<InfoArticleDto>>
{
    public async Task<Result<InfoArticleDto>> Handle(
        GetInfoArticleBySlugQuery request,
        CancellationToken cancellationToken)
    {
        var entity = await repository.GetBySlugAsync(request.Slug, cancellationToken);

        return entity is null
            ? Result.Failure<InfoArticleDto>($"Info article '{request.Slug}' was not found.")
            : Result.Success(InfoArticleDto.FromEntity(entity));
    }
}
