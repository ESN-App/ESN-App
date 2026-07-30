using EsnApp.Application.Common;
using MediatR;

namespace EsnApp.Application.Info;

public record DeleteInfoArticleCommand(Guid Id) : IRequest<Result<bool>>;

public class DeleteInfoArticleCommandHandler(IInfoArticleRepository repository)
    : IRequestHandler<DeleteInfoArticleCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        DeleteInfoArticleCommand request,
        CancellationToken cancellationToken)
    {
        var deleted = await repository.DeleteAsync(request.Id, cancellationToken);
        return deleted
            ? Result.Success(true)
            : Result.Failure<bool>($"Info article '{request.Id}' was not found.");
    }
}
