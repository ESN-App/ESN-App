using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Abstractions;
using MediatR;

namespace EsnApp.Application.Discounts.DeletePartner;

public class DeletePartnerCommandHandler(IPartnerRepository repository)
    : IRequestHandler<DeletePartnerCommand, Result>
{
    public async Task<Result> Handle(
        DeletePartnerCommand request,
        CancellationToken cancellationToken)
    {
        var deleted = await repository.DeleteAsync(request.Id, cancellationToken);

        return deleted
            ? Result.Success()
            : Result.Failure($"Partner '{request.Id}' was not found.");
    }
}
