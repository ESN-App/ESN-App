using EsnApp.Application.Common;
using MediatR;

namespace EsnApp.Application.Info;

public record GetInfoArticleByIdQuery(Guid Id) : IRequest<Result<InfoArticleDto>>;

public class GetInfoArticleByIdQueryHandler(IInfoArticleRepository repository)
    : IRequestHandler<GetInfoArticleByIdQuery, Result<InfoArticleDto>>
{
    public async Task<Result<InfoArticleDto>> Handle(
        GetInfoArticleByIdQuery request,
        CancellationToken cancellationToken)
    {
        var entity = await repository.GetByIdAsync(request.Id, cancellationToken);

        return entity is null
            ? Result.Failure<InfoArticleDto>($"Info article '{request.Id}' was not found.")
            : Result.Success(InfoArticleDto.FromEntity(entity));
    }
}
